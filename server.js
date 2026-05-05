const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas explícitas para páginas HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ── Clientes de servicios ──────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Multer para subida de archivos ────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['xlsx', 'xls', 'pdf', 'doc', 'docx'];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten archivos Excel, PDF o Word'));
  }
});

// ── Nodemailer ────────────────────────────────────────────────
function crearTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  AUTH — LOGIN
// ══════════════════════════════════════════════════════════════
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const { data: cliente } = await supabase
      .from('normaai_clientes')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (!cliente || !cliente.activo) {
      return res.status(403).json({ error: 'Acceso no autorizado. Contacte a Procesus.' });
    }

    res.json({
      token: data.session.access_token,
      user: {
        email: data.user.email,
        nombre: cliente.nombre,
        rol: cliente.rol || 'cliente',
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ══════════════════════════════════════════════════════════════
//  MIDDLEWARE — Verificar token
// ══════════════════════════════════════════════════════════════
async function verificarToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = auth.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ══════════════════════════════════════════════════════════════
//  NOTICIAS
// ══════════════════════════════════════════════════════════════
app.get('/api/noticias', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select('*')
      .eq('publicada', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar noticias' });
  }
});

// ══════════════════════════════════════════════════════════════
//  AGENTE IA
// ══════════════════════════════════════════════════════════════
app.post('/api/agente', verificarToken, async (req, res) => {
  const { mensaje, historial = [] } = req.body;
  if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });

  const mesActual = new Date().toISOString().slice(0, 7);
  const { data: uso } = await supabase
    .from('uso_agente')
    .select('consultas')
    .eq('user_id', req.user.id)
    .eq('mes', mesActual)
    .single();

  const consultasUsadas = uso?.consultas || 0;
  const LIMITE_MENSUAL = parseInt(process.env.LIMITE_CONSULTAS_MES || '100');

  if (consultasUsadas >= LIMITE_MENSUAL) {
    return res.status(429).json({
      error: `Has alcanzado el límite de ${LIMITE_MENSUAL} consultas este mes. Contáctanos en contacto@normaai.cl`
    });
  }

  try {
    let contexto_bcn = 'Biblioteca del Congreso Nacional de Chile: bcn.cl/leychile';
    let contexto_kb = '';
    try {
      const palabras = mensaje.toLowerCase();
      const normaDetectada =
        palabras.includes('14001') || palabras.includes('ambiental') || palabras.includes('medio ambiente') ? 'ISO 14001' :
        palabras.includes('45001') || palabras.includes('seguridad') || palabras.includes('accidente') || palabras.includes('salud') ? 'ISO 45001' :
        palabras.includes('27001') || palabras.includes('datos') || palabras.includes('información') || palabras.includes('ciberseguridad') ? 'ISO 27001' :
        palabras.includes('37001') || palabras.includes('antisoborno') || palabras.includes('corrupción') || palabras.includes('compliance') ? 'ISO 37001' :
        palabras.includes('22000') || palabras.includes('alimento') || palabras.includes('inocuidad') ? 'ISO 22000' :
        palabras.includes('laboral') || palabras.includes('trabajador') || palabras.includes('contrato') ? 'General' : null;

      if (normaDetectada) {
        const { data: kbData } = await supabase
          .from('normaai_kb')
          .select('cuerpo_legal, numero, titulo, articulos_clave, como_cumplir, evidencia_minima, url_bcn')
          .eq('norma_iso', normaDetectada)
          .eq('vigente', true)
          .limit(5);

        if (kbData && kbData.length > 0) {
          contexto_kb = '\n\nNORMATIVA RELEVANTE DE LA BASE DE CONOCIMIENTO:\n' +
            kbData.map(k =>
              `- ${k.cuerpo_legal} N°${k.numero}: ${k.titulo}\n  Artículos clave: ${k.articulos_clave}\n  Cómo cumplir: ${k.como_cumplir}\n  Evidencia mínima: ${k.evidencia_minima}\n  Fuente: ${k.url_bcn}`
            ).join('\n\n');
        }
      }
    } catch(e) {
      console.error('Error KB:', e);
    }

    const mensajes = [
      ...historial.slice(-6).map(m => ({
        role: m.rol,
        content: m.contenido
      })),
      { role: 'user', content: mensaje }
    ];

    const respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `Eres NormaAI, un agente especializado en normativa legal chilena. 
Ayudas a empresas con sistemas de gestión ISO (9001, 14001, 45001, 27001, 37001, 37301 y otras) 
a entender y cumplir sus requisitos legales en Chile.

INSTRUCCIONES:
- Al inicio de cada conversación nueva, preséntate brevemente y pregunta: 
  "¿En qué área normativa o cuerpo legal puedo ayudarte hoy? (Ej: seguridad laboral, medio ambiente, protección de datos, laboral, etc.)"
- Responde SIEMPRE en español
- Cita leyes chilenas específicas con su número cuando sea posible
- Explica cómo cumplir cada requisito y qué evidencia mínima se necesita
- Si no tienes certeza de algo, indícalo claramente y sugiere consultar bcn.cl/leychile
- NO hagas evaluaciones de cumplimiento (no tienes acceso a la evidencia de la empresa)
- NO generes informes ni certificados (eso es un servicio separado de Procesus)
- Mantén un tono profesional pero cercano
- Fuente de normativa: ${contexto_bcn}`,
      messages: mensajes,
    });

    const textoRespuesta = respuesta.content[0].text;

    await supabase.from('uso_agente').upsert({
      user_id: req.user.id,
      mes: mesActual,
      consultas: consultasUsadas + 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,mes' });

    const sesionId = req.body.sesion_id || `sesion_${Date.now()}`;
    await supabase.from('normaai_conversaciones').insert([
      { user_id: req.user.id, sesion_id: sesionId, rol: 'user', contenido: mensaje },
      { user_id: req.user.id, sesion_id: sesionId, rol: 'assistant', contenido: textoRespuesta }
    ]);

    res.json({
      respuesta: textoRespuesta,
      consultas_usadas: consultasUsadas + 1,
      limite: LIMITE_MENSUAL,
      sesion_id: sesionId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar consulta' });
  }
});

// ══════════════════════════════════════════════════════════════
//  HISTORIAL
// ══════════════════════════════════════════════════════════════
app.post('/api/historial/guardar', verificarToken, async (req, res) => {
  const { sesion_id, rol, contenido, tiene_documento, nombre_documento } = req.body;
  try {
    await supabase.from('normaai_conversaciones').insert({
      user_id: req.user.id,
      sesion_id,
      rol,
      contenido,
      tiene_documento: tiene_documento || false,
      nombre_documento: nombre_documento || null,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar mensaje' });
  }
});

app.get('/api/historial/sesiones', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('normaai_conversaciones')
      .select('sesion_id, created_at, contenido, tiene_documento, nombre_documento')
      .eq('user_id', req.user.id)
      .eq('rol', 'user')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const sesiones = {};
    data.forEach(msg => {
      if (!sesiones[msg.sesion_id]) {
        sesiones[msg.sesion_id] = {
          sesion_id: msg.sesion_id,
          primera_pregunta: msg.contenido.slice(0, 80),
          fecha: msg.created_at,
          tiene_documento: msg.tiene_documento,
          nombre_documento: msg.nombre_documento,
        };
      }
    });

    res.json(Object.values(sesiones).slice(0, 30));
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar historial' });
  }
});

app.get('/api/historial/sesion/:sesion_id', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('normaai_conversaciones')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('sesion_id', req.params.sesion_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar sesión' });
  }
});

// ══════════════════════════════════════════════════════════════
//  DOCUMENTOS — Analizar PDF/Word
// ══════════════════════════════════════════════════════════════
app.post('/api/analizar-documento', verificarToken, async (req, res) => {
  const { nombre, contenido_texto, sesion_id } = req.body;

  const ext = nombre?.split('.').pop()?.toLowerCase();
  if (['xlsx','xls','csv'].includes(ext)) {
    return res.status(400).json({
      error: 'Los archivos Excel y CSV no están disponibles en el agente. La evaluación de cumplimiento de matrices es un servicio separado. Contacta a Procesus para más información.'
    });
  }

  if (!contenido_texto || contenido_texto.length < 50) {
    return res.status(400).json({ error: 'No se pudo extraer texto del documento.' });
  }

  try {
    const respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Eres NormaAI, especialista en normativa legal chilena. 
Cuando recibes un documento (procedimiento, instructivo, política, etc.), debes:
1. Identificar de qué tipo de documento se trata
2. Revisar si cumple con la normativa chilena aplicable
3. Señalar artículos o requisitos legales específicos que aplican
4. Indicar observaciones concretas de mejora
5. Aclarar siempre: "Esta revisión es orientativa y no reemplaza la evaluación formal de cumplimiento."
Responde en español, de forma clara y estructurada.`,
      messages: [{
        role: 'user',
        content: `Por favor revisa este documento desde el punto de vista de la normativa legal chilena:

Nombre: ${nombre}

Contenido:
${contenido_texto.slice(0, 4000)}`
      }]
    });

    const textoRespuesta = respuesta.content[0].text;

    const mesActual = new Date().toISOString().slice(0, 7);
    const { data: uso } = await supabase
      .from('normaai_uso_agente')
      .select('consultas')
      .eq('user_id', req.user.id)
      .eq('mes', mesActual)
      .single();

    await supabase.from('normaai_uso_agente').upsert({
      user_id: req.user.id,
      mes: mesActual,
      consultas: (uso?.consultas || 0) + 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,mes' });

    res.json({ respuesta: textoRespuesta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al analizar documento' });
  }
});

// ══════════════════════════════════════════════════════════════
//  MATRIZ — Subir y analizar matriz legal del cliente
// ══════════════════════════════════════════════════════════════

// ── Cliente: Subir matriz ─────────────────────────────────────
app.post('/api/matriz/subir', verificarToken, upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const { nombre_empresa } = req.body;
    const archivo = req.file;
    const ext = archivo.originalname.split('.').pop().toLowerCase();

    const { data: cliente } = await supabase
      .from('normaai_clientes')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const empresa = nombre_empresa || cliente?.empresa || 'Sin nombre';

    // Generar análisis IA
    let informeIA = '';
    try {
      if (ext === 'pdf') {
        const archivoBase64 = archivo.buffer.toString('base64');
        const mensajeIA = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: archivoBase64 }
              },
              {
                type: 'text',
                text: `Eres un consultor legal especializado en normativa chilena. Analiza esta matriz de requisitos legales de la empresa "${empresa}" y genera un informe estructurado con:

## 1. RESUMEN EJECUTIVO
Total de cuerpos legales identificados, estado general de la matriz.

## 2. ANÁLISIS POR CUERPO LEGAL
Para cada ley/decreto identificado, evalúa si los artículos están completos y actualizados según la normativa chilena vigente.

## 3. BRECHAS DETECTADAS
Requisitos que podrían faltar o estar desactualizados. Menciona normas específicas si detectas ausencias.

## 4. RECOMENDACIONES
Acciones concretas ordenadas por prioridad.

## 5. VALIDEZ DE LA MATRIZ
Indica si la matriz cumple con los estándares mínimos para una auditoría ISO.

Sé específico con números de leyes y decretos chilenos.`
              }
            ]
          }]
        });
        informeIA = mensajeIA.content[0].text;
      } else {
        // Excel o Word — análisis general
        const mensajeIA = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Eres un consultor legal especializado en normativa chilena. Se recibió una matriz de requisitos legales de la empresa "${empresa}" en formato ${ext.toUpperCase()}.

Nombre del archivo: ${archivo.originalname}
Tamaño: ${(archivo.size / 1024).toFixed(1)} KB

Genera un informe preliminar con:

## 1. RECEPCIÓN CONFIRMADA
Confirma recepción de la matriz.

## 2. QUÉ SE REVISARÁ
Lista los aspectos que el equipo evaluará: completitud de cuerpos legales, actualización según Diario Oficial vigente, brechas potenciales según rubro.

## 3. ESTÁNDARES DE REVISIÓN
Menciona las principales normas chilenas que se verificarán según el tipo de empresa (laboral, ambiental, SST, datos personales, etc.).

## 4. PRÓXIMOS PASOS
El cliente recibirá el informe completo con sello Procesus en 24-48 horas hábiles.`
          }]
        });
        informeIA = mensajeIA.content[0].text;
      }
    } catch (e) {
      console.error('Error IA:', e.message);
      informeIA = 'Matriz recibida correctamente. El equipo de Procesus realizará el análisis detallado en las próximas 24-48 horas hábiles.';
    }

    // Guardar en Supabase
    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .insert({
        user_id: req.user.id,
        empresa: empresa,
        nombre_archivo: archivo.originalname,
        contenido_texto: `Archivo ${ext.toUpperCase()}: ${archivo.originalname} (${(archivo.size/1024).toFixed(1)} KB)`,
        informe_ia: informeIA,
        estado: 'pendiente'
      })
      .select()
      .single();

    if (error) throw error;

    // Notificar a Cristián
    try {
      const transporter = crearTransporter();
      await transporter.sendMail({
        from: `"NormaAI Legal" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `📋 Nueva matriz recibida — ${empresa}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0f2a4a;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="color:white;margin:0;">NormaAI Legal — Nueva Matriz Recibida</h2>
            </div>
            <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;">
              <p><strong>Empresa:</strong> ${empresa}</p>
              <p><strong>Archivo:</strong> ${archivo.originalname}</p>
              <p><strong>Cliente:</strong> ${req.user.email}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'})}</p>
              <hr style="border:1px solid #e2e8f0;margin:20px 0;">
              <h3>Borrador IA:</h3>
              <div style="background:white;padding:16px;border-radius:6px;border-left:4px solid #1e6fc8;">
                ${informeIA.replace(/\n/g,'<br>')}
              </div>
              <hr style="border:1px solid #e2e8f0;margin:20px 0;">
              <a href="https://legal.normaai.cl/admin"
                 style="background:#1e6fc8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                Revisar y Aprobar en el Panel Admin →
              </a>
            </div>
          </div>`
      });
    } catch (emailErr) {
      console.error('Error email notificación:', emailErr.message);
    }

    res.json({
      ok: true,
      mensaje: 'Tu matriz fue recibida correctamente. Recibirás el informe certificado en tu correo en las próximas 24-48 horas hábiles.',
      id: matriz.id
    });

  } catch (err) {
    console.error('Error subir matriz:', err);
    res.status(500).json({ error: 'Error al procesar la matriz. Intenta nuevamente.' });
  }
});

// ── Cliente: Ver estado de sus matrices ───────────────────────
app.get('/api/matriz/mis-matrices', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('normaai_matrices')
      .select('id, empresa, nombre_archivo, estado, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar matrices' });
  }
});

// ── Cliente: Descargar informe aprobado ───────────────────────
app.get('/api/matriz/:id/descargar', verificarToken, async (req, res) => {
  try {
    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !matriz) return res.status(404).json({ error: 'Matriz no encontrada' });
    if (matriz.estado !== 'enviado' && matriz.estado !== 'aprobado') {
      return res.status(400).json({ error: 'El informe aún no está disponible' });
    }

    res.json({
      informe: matriz.informe_ia,
      nombre_archivo: matriz.nombre_archivo,
      empresa: matriz.empresa,
      fecha: matriz.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al descargar informe' });
  }
});

// ══════════════════════════════════════════════════════════════
//  MIDDLEWARE ADMIN
// ══════════════════════════════════════════════════════════════
async function verificarAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No autorizado' });
  const token = auth.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });
    const { data: cliente } = await supabase
      .from('normaai_clientes')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (!cliente || cliente.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Token inválido' }); }
}

// ── Admin: Clientes ──────────────────────────────────────────
app.get('/api/admin/clientes', verificarAdmin, async (req, res) => {
  const { data } = await supabase.from('normaai_clientes').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/admin/clientes/toggle', verificarAdmin, async (req, res) => {
  const { id, activo } = req.body;
  await supabase.from('normaai_clientes').update({ activo }).eq('id', id);
  res.json({ ok: true });
});

// ── Admin: Noticias ──────────────────────────────────────────
app.get('/api/admin/noticias', verificarAdmin, async (req, res) => {
  const { data } = await supabase.from('normaai_noticias').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/admin/noticias/crear', verificarAdmin, async (req, res) => {
  const { titulo, resumen, categoria, url, video_url, publicada } = req.body;
  const { error } = await supabase.from('normaai_noticias').insert({ titulo, resumen, categoria, url, video_url, publicada });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/api/admin/noticias/toggle', verificarAdmin, async (req, res) => {
  const { id, publicada } = req.body;
  await supabase.from('normaai_noticias').update({ publicada }).eq('id', id);
  res.json({ ok: true });
});

app.post('/api/admin/noticias/eliminar', verificarAdmin, async (req, res) => {
  const { id } = req.body;
  await supabase.from('normaai_noticias').delete().eq('id', id);
  res.json({ ok: true });
});

// ── Admin: Uso agente ────────────────────────────────────────
app.get('/api/admin/uso', verificarAdmin, async (req, res) => {
  const { data: uso } = await supabase
    .from('normaai_uso_agente')
    .select('*')
    .order('updated_at', { ascending: false });

  const { data: clientes } = await supabase
    .from('normaai_clientes')
    .select('user_id, email, nombre');

  const clienteMap = {};
  (clientes || []).forEach(c => { clienteMap[c.user_id] = c.email; });

  const resultado = (uso || []).map(u => ({
    ...u,
    email: clienteMap[u.user_id] || u.user_id
  }));

  res.json(resultado);
});

// ── Admin: Ver todas las matrices ─────────────────────────────
app.get('/api/admin/matrices', verificarAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('normaai_matrices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: clientes } = await supabase
      .from('normaai_clientes')
      .select('user_id, email, nombre');

    const clienteMap = {};
    (clientes || []).forEach(c => { clienteMap[c.user_id] = { email: c.email, nombre: c.nombre }; });

    const resultado = (data || []).map(m => ({
      ...m,
      cliente_email: clienteMap[m.user_id]?.email || m.user_id,
      cliente_nombre: clienteMap[m.user_id]?.nombre || 'Sin nombre'
    }));

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar matrices' });
  }
});

// ── Admin: Ver detalle de una matriz ─────────────────────────
app.get('/api/admin/matrices/:id', verificarAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('normaai_matrices')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'No encontrada' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar matriz' });
  }
});

// ── Admin: Editar informe antes de aprobar ────────────────────
app.post('/api/admin/matrices/:id/editar', verificarAdmin, async (req, res) => {
  try {
    const { informe_ia } = req.body;
    await supabase
      .from('normaai_matrices')
      .update({ informe_ia, estado: 'en_revision', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// ── Admin: Aprobar y enviar informe al cliente ────────────────
app.post('/api/admin/matrices/:id/aprobar', verificarAdmin, async (req, res) => {
  try {
    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !matriz) return res.status(404).json({ error: 'Matriz no encontrada' });

    const { data: { user } } = await supabase.auth.admin.getUserById(matriz.user_id);
    const emailCliente = user?.email;
    if (!emailCliente) return res.status(400).json({ error: 'No se encontró el email del cliente' });

    const fechaEmision = new Date().toLocaleDateString('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const transporter = crearTransporter();
    await transporter.sendMail({
      from: `"NormaAI Legal — Procesus" <${process.env.GMAIL_USER}>`,
      to: emailCliente,
      subject: `✅ Informe de Revisión de Matriz Legal — ${matriz.empresa}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0f2a4a,#1e6fc8);padding:28px 32px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">NormaAI Legal</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:14px;">by Procesus — Laboratorio de Comunicación Social y Artificial</p>
          </div>
          <div style="background:#f8fafc;padding:28px 32px;border:1px solid #e2e8f0;">
            <p style="font-size:16px;color:#1e293b;">Estimado/a cliente de <strong>${matriz.empresa}</strong>,</p>
            <p style="color:#475569;">La revisión de su <strong>Matriz de Requisitos Legales</strong> ha sido completada por nuestro equipo de consultores especializados.</p>
            <div style="background:white;border-radius:8px;padding:24px;border:1px solid #e2e8f0;margin:20px 0;">
              <h2 style="color:#0f2a4a;font-size:16px;margin-top:0;border-bottom:2px solid #e2e8f0;padding-bottom:12px;">📋 Informe de Revisión</h2>
              <p style="color:#64748b;font-size:13px;"><strong>Archivo analizado:</strong> ${matriz.nombre_archivo}</p>
              <p style="color:#64748b;font-size:13px;"><strong>Fecha de emisión:</strong> ${fechaEmision}</p>
              <div style="color:#334155;line-height:1.7;margin-top:16px;">
                ${matriz.informe_ia.replace(/\n/g,'<br>').replace(/## /g,'<h3 style="color:#0f2a4a;">').replace(/\*\*/g,'')}
              </div>
            </div>
            <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:20px;margin:20px 0;">
              <h2 style="color:#15803d;font-size:15px;margin-top:0;">🏆 Certificado de Revisión — Procesus</h2>
              <p style="color:#166534;font-size:13px;line-height:1.6;margin:0;">
                <strong>Procesus — NormaAI Legal</strong> certifica que la Matriz de Requisitos Legales 
                de <strong>${matriz.empresa}</strong> fue revisada el <strong>${fechaEmision}</strong> 
                por consultores especializados en normativa chilena, contrastada con el 
                <strong>Diario Oficial de la República de Chile</strong> vigente a la misma fecha 
                y verificada según los estándares de los sistemas de gestión ISO aplicables.
              </p>
              <p style="color:#166534;font-size:12px;margin:12px 0 0;font-style:italic;">
                Este certificado es válido por 12 meses desde su emisión. 
                Folio: NormaAI-${matriz.id.substring(0,8).toUpperCase()}
              </p>
            </div>
            <a href="https://legal.normaai.cl/dashboard"
               style="background:#1e6fc8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-size:14px;">
              Ver en la Plataforma →
            </a>
          </div>
          <div style="background:#0f2a4a;padding:16px 32px;border-radius:0 0 8px 8px;text-align:center;">
            <p style="color:#6b8ab0;font-size:12px;margin:0;">Procesus — NormaAI Legal · legal.normaai.cl</p>
          </div>
        </div>`
    });

    await supabase
      .from('normaai_matrices')
      .update({ estado: 'enviado', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    res.json({ ok: true, mensaje: `Informe enviado a ${emailCliente}` });

  } catch (err) {
    console.error('Error aprobar matriz:', err);
    res.status(500).json({ error: 'Error al aprobar y enviar: ' + err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  LOGOUT
// ══════════════════════════════════════════════════════════════
app.post('/api/logout', verificarToken, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  await supabase.auth.admin.signOut(token);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`NormaAI Legal Portal corriendo en puerto ${PORT}`));

module.exports = app;
