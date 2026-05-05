const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, Packer } = require('docx');

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
  const { mensaje, historial = [], documento } = req.body;
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

    // Construir contenido del mensaje del usuario (con o sin documento adjunto)
    let contenidoUsuario;
    if (documento && documento.base64 && documento.nombre) {
      const ext = documento.nombre.split('.').pop().toLowerCase();
      if (ext === 'pdf') {
        contenidoUsuario = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: documento.base64 } },
          { type: 'text', text: mensaje || 'Por favor revisa este documento desde el punto de vista de la normativa legal chilena aplicable.' }
        ];
      } else {
        // DOCX u otros: enviar como texto indicando el nombre
        contenidoUsuario = [
          { type: 'text', text: `[Documento adjunto: ${documento.nombre}]

${mensaje || 'Por favor revisa este documento desde el punto de vista de la normativa legal chilena aplicable.'}` }
        ];
      }
    } else {
      contenidoUsuario = mensaje;
    }

    const mensajes = [
      ...historial.slice(-6).map(m => ({
        role: m.rol,
        content: m.contenido
      })),
      { role: 'user', content: contenidoUsuario }
    ];

    const respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `Eres NormaAI, un agente legal especializado en normativa chilena vigente.
Apoyas a empresas con sistemas de gestión ISO (9001, 14001, 45001, 27001, 37001, 37301 y otras) a entender y cumplir sus requisitos legales en Chile.

ROL Y LÍMITES — MUY IMPORTANTE:
- Eres un ASESOR LEGAL, no un consultor de implementación ISO
- NUNCA ofrezcas ni menciones: capacitaciones, auditorías, implementación de normas, planes de acción, consultorías o servicios de Procesus
- NUNCA generes informes formales, certificados ni documentos con sello
- Tu función es EXCLUSIVAMENTE orientar en la normativa legal chilena aplicable: qué leyes aplican, qué exigen, cómo se interpretan

INSTRUCCIONES:
- Responde SIEMPRE en español
- Cita leyes y reglamentos chilenos específicos con su número (Ej: Ley N°16.744, DS N°594, Ley N°21.719)
- Señala artículos específicos cuando sea relevante
- Si recibes un documento adjunto, analiza su contenido desde el punto de vista legal: identifica qué normativa aplica, qué cumple y qué podría mejorar desde la perspectiva legal
- Agrega siempre al final de análisis de documentos: "Esta revisión es orientativa y no reemplaza la evaluación formal de cumplimiento legal."
- Si no tienes certeza de algo, indícalo y sugiere consultar bcn.cl/leychile
- Mantén un tono profesional y directo
- Fuente de normativa: ${contexto_bcn}${contexto_kb}`,
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
// ══════════════════════════════════════════════════════════════
//  MATRIZ — Subir y analizar matriz legal del cliente
// ══════════════════════════════════════════════════════════════

// Leer Excel real con SheetJS
function leerExcel(buffer) {
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const resultado = [];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const articulos = [];
      let headerFound = false;
      let colMap = {};
      for (const row of rows) {
        const rowStr = row.map(c => String(c||'').trim());
        if (!headerFound) {
          const hasHeader = rowStr.some(c => {
            const cu = c.toUpperCase();
            return cu.includes('ARTÍCULO') || cu.includes('ARTICULO') || cu.includes('DESCRIPCIÓN') || cu.includes('DESCRIPCION');
          });
          if (hasHeader) {
            headerFound = true;
            rowStr.forEach((h, i) => {
              const hu = h.toUpperCase();
              if (hu.includes('ARTÍCULO') || hu.includes('ARTICULO')) colMap.art = i;
              if (hu.includes('DESCRIPCIÓN') || hu.includes('DESCRIPCION')) colMap.desc = i;
              if (hu.includes('COMO') || hu.includes('CÓMO')) colMap.como = i;
              if (hu.includes('CUMPLE') && !hu.includes('INCUMPLE')) colMap.cumple = i;
              if (hu.includes('RESPONSABLE') || (hu.includes('NOMBRE') && !hu.includes('EVALUADOR'))) colMap.resp = i;
            });
          }
          continue;
        }
        const art = String(row[colMap.art] || '').trim();
        const desc = String(row[colMap.desc] || '').trim();
        const como = String(row[colMap.como] || '').trim();
        const cumple = String(row[colMap.cumple] || '').trim();
        if ((art || desc) && desc.length > 5) {
          articulos.push({ art, desc: desc.substring(0, 300), como: como.substring(0, 300), cumple });
        }
      }
      if (articulos.length > 0) resultado.push({ cuerpoLegal: sheetName, articulos });
    }
    return resultado;
  } catch(e) {
    console.error('Error leyendo Excel:', e.message);
    return [];
  }
}

// ── Cliente: Subir matriz ─────────────────────────────────────
app.post('/api/matriz/subir', verificarToken, upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const { nombre_empresa } = req.body;
    const archivo = req.file;
    const ext = archivo.originalname.split('.').pop().toLowerCase();
    const fechaHoy = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

    const { data: cliente } = await supabase
      .from('normaai_clientes')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const empresa = nombre_empresa || cliente?.empresa || 'Sin nombre';

    let informeIA = '';
    try {
      if (['xlsx', 'xls'].includes(ext)) {
        const datosExcel = leerExcel(archivo.buffer);
        const totalCuerpos = datosExcel.length;
        const totalRequisitos = datosExcel.reduce((s, h) => s + h.articulos.length, 0);
        const cumplen = datosExcel.reduce((s, h) => s + h.articulos.filter(a => {
          const c = a.cumple.toUpperCase();
          return c === 'SI' || c === 'SÍ' || c === 'X' || c === 'TRUE';
        }).length, 0);
        const noCumplen = datosExcel.reduce((s, h) => s + h.articulos.filter(a => {
          const c = a.cumple.toUpperCase();
          return c === 'NO' || c === 'FALSE';
        }).length, 0);
        const parcial = Math.max(0, totalRequisitos - cumplen - noCumplen);
        const pctCumplimiento = totalRequisitos > 0 ? ((cumplen / totalRequisitos) * 100).toFixed(1) : '0.0';

        const resumenTexto = datosExcel.map(hoja =>
          `CUERPO LEGAL: ${hoja.cuerpoLegal} (${hoja.articulos.length} requisitos)\n` +
          hoja.articulos.map(a =>
            `  Art.${a.art || 'N/A'}: ${a.desc.substring(0, 150)}\n  Como cumple: ${a.como || 'NO ESPECIFICADO'}\n  Cumple: ${a.cumple || 'NO INDICADO'}`
          ).join('\n')
        ).join('\n\n');

        const mensajeIA = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Eres Cristián Cordero, consultor ISO senior de Procesus. Analiza la siguiente matriz de requisitos legales de "${empresa}" y genera el INFORME DE CUMPLIMIENTO NORMATIVO completo.

ESTADÍSTICAS DE LA MATRIZ:
- Cuerpos legales: ${totalCuerpos}
- Total requisitos: ${totalRequisitos}
- Cumplen: ${cumplen} | Parcial: ${parcial} | No cumplen: ${noCumplen}
- % Cumplimiento global: ${pctCumplimiento}%

CONTENIDO COMPLETO DE LA MATRIZ:
${resumenTexto}

Genera el informe con estas secciones:

## RESUMEN EJECUTIVO
Describe el nivel de cumplimiento (ALTO >80%, MEDIO 50-80%, BAJO <50%) con los números exactos. Evalúa el estado general de la matriz.

## CUMPLIMIENTO POR CUERPO LEGAL
Para cada cuerpo legal: total requisitos, cumplen, parcial, no cumplen, % cumplimiento. Formato tabla de texto.

## BRECHAS DETECTADAS Y RECOMENDACIONES
Identifica artículos sin "cómo se cumple" completo o con cumplimiento negativo/parcial. Para cada brecha: qué falta y acción correctiva específica. Si no hay brechas significativas, indica cumplimiento total y da recomendaciones de mejora continua.

## VALIDEZ PARA AUDITORÍA ISO
Evalúa si la matriz está lista para una auditoría. Señala qué ajustes se requieren si los hay.

Fecha de revisión: ${fechaHoy}
Generado por: Procesus — NormaAI Legal`
          }]
        });
        informeIA = mensajeIA.content[0].text;

      } else if (ext === 'pdf') {
        const archivoBase64 = archivo.buffer.toString('base64');
        const mensajeIA = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: archivoBase64 } },
              { type: 'text', text: `Eres Cristián Cordero, consultor ISO de Procesus. Analiza esta matriz de requisitos legales de "${empresa}" (fecha: ${fechaHoy}) y genera un informe completo con: resumen ejecutivo con KPIs, cumplimiento por cuerpo legal, brechas detectadas con recomendaciones específicas, y validez para auditoría ISO.` }
            ]
          }]
        });
        informeIA = mensajeIA.content[0].text;

      } else {
        informeIA = `## RECEPCIÓN CONFIRMADA\n\nMatriz recibida el ${fechaHoy}.\n- Archivo: ${archivo.originalname}\n- Empresa: ${empresa}\n\n## PRÓXIMOS PASOS\n\nEl equipo de Procesus analizará el documento y enviará el informe certificado en 24-48 horas hábiles.`;
      }
    } catch (e) {
      console.error('Error IA:', e.message);
      informeIA = `Matriz recibida el ${fechaHoy}. El equipo de Procesus realizará el análisis en las próximas 24-48 horas hábiles.`;
    }

    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .insert({
        user_id: req.user.id,
        empresa: empresa,
        nombre_archivo: archivo.originalname,
        contenido_texto: `${ext.toUpperCase()}: ${archivo.originalname} (${(archivo.size/1024).toFixed(1)} KB)`,
        informe_ia: informeIA,
        estado: 'pendiente',
        archivo_original_base64: archivo.buffer.toString('base64'),
        archivo_original_nombre: archivo.originalname,
        archivo_original_tipo: archivo.mimetype || 'application/octet-stream'
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
              <h2 style="color:white;margin:0;">NormaAI Legal — Nueva Matriz</h2>
            </div>
            <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;">
              <p><strong>Empresa:</strong> ${empresa}</p>
              <p><strong>Archivo:</strong> ${archivo.originalname}</p>
              <p><strong>Cliente:</strong> ${req.user.email}</p>
              <p><strong>Fecha:</strong> ${fechaHoy}</p>
              <hr style="border:1px solid #e2e8f0;margin:16px 0;">
              <p style="color:#64748b;font-size:13px;">El análisis IA está listo para tu revisión en el panel admin.</p>
              <a href="https://legal.normaai.cl/admin" style="background:#1e6fc8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">
                Revisar en el Panel Admin →
              </a>
            </div>
          </div>`
      });
    } catch (emailErr) {
      console.error('Error email:', emailErr.message);
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
      fecha: matriz.updated_at,
      tiene_archivo_final: !!matriz.informe_final_base64,
      informe_final_nombre: matriz.informe_final_nombre || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al descargar informe' });
  }
});

// ── Cliente: Descargar archivo final del informe ──────────────
app.get('/api/matriz/:id/archivo-final', verificarToken, async (req, res) => {
  try {
    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .select('informe_final_base64, informe_final_nombre, informe_ia, empresa, id, updated_at, estado')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !matriz) return res.status(404).json({ error: 'No encontrada' });
    if (matriz.estado !== 'enviado' && matriz.estado !== 'aprobado') {
      return res.status(400).json({ error: 'Informe no disponible aún' });
    }

    let buffer, nombre, tipo;
    if (matriz.informe_final_base64) {
      buffer = Buffer.from(matriz.informe_final_base64, 'base64');
      nombre = matriz.informe_final_nombre || `Informe_${(matriz.empresa||'NormaAI').replace(/[^a-zA-Z0-9]/g,'_')}.docx`;
      tipo = nombre.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      // Generar Word del borrador si no hay archivo final
      const fechaEmision = new Date(matriz.updated_at).toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' });
      buffer = await generarWordBuffer(matriz, fechaEmision);
      nombre = `Informe_${(matriz.empresa||'NormaAI').replace(/[^a-zA-Z0-9]/g,'_')}_NormaAI.docx`;
      tipo = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    res.setHeader('Content-Type', tipo);
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al descargar archivo' });
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

// ── Generar documento Word del informe ───────────────────────
function generarWordBuffer(matriz, fechaEmision) {
  const lineas = (matriz.informe_ia || '').split('\n');
  const children = [];

  // Portada
  children.push(new Paragraph({
    children: [new TextRun({ text: 'PROCESUS — NormaAI Legal', bold: true, size: 32, color: '0f2a4a' })],
    alignment: AlignmentType.CENTER, spacing: { after: 200 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: 'INFORME DE CUMPLIMIENTO NORMATIVO', bold: true, size: 28, color: '1e6fc8' })],
    alignment: AlignmentType.CENTER, spacing: { after: 200 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Empresa: ${matriz.empresa}`, bold: true, size: 24 })],
    alignment: AlignmentType.CENTER, spacing: { after: 100 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Archivo analizado: ${matriz.nombre_archivo}`, size: 20, color: '64748b' })],
    alignment: AlignmentType.CENTER, spacing: { after: 100 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Fecha de emisión: ${fechaEmision}`, size: 20, color: '64748b' })],
    alignment: AlignmentType.CENTER, spacing: { after: 100 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Folio: NormaAI-${matriz.id.substring(0,8).toUpperCase()}`, size: 18, color: '94a3b8' })],
    alignment: AlignmentType.CENTER, spacing: { after: 400 }
  }));
  children.push(new Paragraph({ children: [new TextRun({ text: '─'.repeat(60), color: 'e2e8f0' })], spacing: { after: 400 } }));

  // Contenido del informe
  for (const linea of lineas) {
    const trim = linea.trim();
    if (!trim) {
      children.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }
    if (trim.startsWith('# ') && !trim.startsWith('## ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trim.replace(/^# /, ''), bold: true, size: 28, color: '0f2a4a' })],
        heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }
      }));
    } else if (trim.startsWith('## ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trim.replace(/^## /, ''), bold: true, size: 24, color: '1e6fc8' })],
        heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }
      }));
    } else if (trim.startsWith('### ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trim.replace(/^### /, ''), bold: true, size: 22, color: '334155' })],
        heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }
      }));
    } else if (trim.startsWith('- ') || trim.startsWith('* ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trim.replace(/^[-*] /, ''), size: 20 })],
        bullet: { level: 0 }, spacing: { after: 80 }
      }));
    } else if (/^\d+\./.test(trim)) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trim, size: 20 })],
        numbering: { reference: 'default-numbering', level: 0 }, spacing: { after: 80 }
      }));
    } else {
      // Procesar negritas inline
      const partes = trim.split(/\*\*([^*]+)\*\*/);
      const runs = partes.map((p, i) => new TextRun({ text: p, bold: i % 2 === 1, size: 20 }));
      children.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
    }
  }

  // Certificado
  children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 400 } }));
  children.push(new Paragraph({
    children: [new TextRun({ text: '🏆 CERTIFICADO DE REVISIÓN — PROCESUS', bold: true, size: 24, color: '15803d' })],
    spacing: { before: 200, after: 200 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({
      text: `Procesus — NormaAI Legal certifica que la Matriz de Requisitos Legales de ${matriz.empresa} fue revisada el ${fechaEmision} por consultores especializados en normativa chilena, contrastada con el Diario Oficial de la República de Chile vigente a la misma fecha y verificada según los estándares de los sistemas de gestión ISO aplicables.`,
      size: 20, color: '166534'
    })],
    spacing: { after: 150 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Este certificado es válido por 12 meses desde su emisión. Folio: NormaAI-${matriz.id.substring(0,8).toUpperCase()}`, size: 18, color: '64748b', italics: true })],
    spacing: { after: 200 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Procesus — NormaAI Legal · legal.normaai.cl · contacto@normaai.cl', size: 18, color: '94a3b8' })],
    alignment: AlignmentType.CENTER, spacing: { before: 400 }
  }));

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }]
      }]
    },
    sections: [{ properties: {}, children }]
  });

  return Packer.toBuffer(doc);
}

// ── Admin: Descargar Word del informe ─────────────────────────
app.get('/api/admin/matrices/:id/word', verificarAdmin, async (req, res) => {
  try {
    const { data: matriz, error } = await supabase
      .from('normaai_matrices').select('*').eq('id', req.params.id).single();
    if (error || !matriz) return res.status(404).json({ error: 'No encontrada' });

    const fechaEmision = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    const buffer = await generarWordBuffer(matriz, fechaEmision);
    const filename = `Informe_${(matriz.empresa||'Procesus').replace(/[^a-zA-Z0-9]/g,'_')}_NormaAI.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generando Word:', err);
    res.status(500).json({ error: 'Error al generar Word: ' + err.message });
  }
});

// ── Admin: Diagnóstico de archivo original (debug endpoint) ──
app.get('/api/admin/matrices/:id/archivo-original/diagnostico', verificarAdmin, async (req, res) => {
  try {
    const { data: meta, error: metaErr } = await supabase
      .from('normaai_matrices')
      .select('id, empresa, nombre_archivo, archivo_original_nombre, archivo_original_tipo, created_at')
      .eq('id', req.params.id)
      .single();

    if (metaErr) return res.json({ ok: false, supabase_error: metaErr.message });
    if (!meta) return res.json({ ok: false, razon: 'Registro no encontrado' });

    const { data: check, error: checkErr } = await supabase
      .from('normaai_matrices')
      .select('archivo_original_base64')
      .eq('id', req.params.id)
      .single();

    const tieneBase64 = !checkErr && check && !!check.archivo_original_base64;
    const longitudBase64 = tieneBase64 ? check.archivo_original_base64.length : 0;

    res.json({
      ok: tieneBase64,
      id: meta.id,
      empresa: meta.empresa,
      nombre_archivo: meta.nombre_archivo,
      archivo_original_nombre: meta.archivo_original_nombre,
      archivo_original_tipo: meta.archivo_original_tipo,
      tiene_base64: tieneBase64,
      longitud_base64: longitudBase64,
      tamano_kb: longitudBase64 ? Math.round(longitudBase64 * 0.75 / 1024) : 0,
      created_at: meta.created_at,
      supabase_error: checkErr ? checkErr.message : null
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Admin: Descargar archivo original del cliente ─────────────
app.get('/api/admin/matrices/:id/archivo-original', verificarAdmin, async (req, res) => {
  try {
    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .select('archivo_original_base64, archivo_original_nombre, archivo_original_tipo, empresa, nombre_archivo')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error(`[archivo-original] Supabase error id=${req.params.id}:`, error.message);
      return res.status(500).json({ error: 'Error en base de datos: ' + error.message });
    }
    if (!matriz) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    if (!matriz.archivo_original_base64) {
      console.warn(`[archivo-original] id=${req.params.id} (${matriz.empresa}) sin archivo_original_base64`);
      return res.status(404).json({
        error: 'Archivo original no disponible',
        detalle: 'Esta matriz fue subida antes de implementar el almacenamiento del archivo original.',
        empresa: matriz.empresa,
        nombre_archivo: matriz.nombre_archivo
      });
    }

    let buffer;
    try {
      buffer = Buffer.from(matriz.archivo_original_base64, 'base64');
    } catch (e) {
      console.error(`[archivo-original] Error decodificando base64 id=${req.params.id}:`, e.message);
      return res.status(500).json({ error: 'Error al decodificar archivo: ' + e.message });
    }

    const nombre = matriz.archivo_original_nombre || matriz.nombre_archivo || 'matriz_cliente';
    const tipo = matriz.archivo_original_tipo || 'application/octet-stream';

    res.setHeader('Content-Type', tipo);
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(buffer);
  } catch (err) {
    console.error(`[archivo-original] Error inesperado id=${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al descargar archivo: ' + err.message });
  }
});

// ── Admin: Subir informe final editado ────────────────────────
app.post('/api/admin/matrices/:id/informe-final', verificarAdmin, upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const archivo = req.file;
    const base64 = archivo.buffer.toString('base64');

    await supabase
      .from('normaai_matrices')
      .update({
        informe_final_base64: base64,
        informe_final_nombre: archivo.originalname,
        estado: 'en_revision',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    res.json({ ok: true, nombre: archivo.originalname });
  } catch (err) {
    res.status(500).json({ error: 'Error al subir informe final' });
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

    // Usar informe final subido por Cristián, o generar Word del borrador
    let adjuntoBuffer, adjuntoNombre, adjuntoTipo;
    if (matriz.informe_final_base64) {
      adjuntoBuffer = Buffer.from(matriz.informe_final_base64, 'base64');
      adjuntoNombre = matriz.informe_final_nombre || `Informe_${(matriz.empresa||'Procesus').replace(/[^a-zA-Z0-9]/g,'_')}_NormaAI.docx`;
      adjuntoTipo = adjuntoNombre.endsWith('.pdf') 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      adjuntoBuffer = await generarWordBuffer(matriz, fechaEmision);
      adjuntoNombre = `Informe_${(matriz.empresa||'Procesus').replace(/[^a-zA-Z0-9]/g,'_')}_NormaAI.docx`;
      adjuntoTipo = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    await transporter.sendMail({
      from: `"NormaAI Legal — Procesus" <${process.env.GMAIL_USER}>`,
      to: emailCliente,
      subject: `✅ Informe de Revisión de Matriz Legal — ${matriz.empresa}`,
      attachments: [
        {
          filename: adjuntoNombre,
          content: adjuntoBuffer,
          contentType: adjuntoTipo
        }
      ],
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0f2a4a,#1e6fc8);padding:28px 32px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">NormaAI Legal</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:14px;">by Procesus — Laboratorio de Comunicación Social y Artificial</p>
          </div>
          <div style="background:#f8fafc;padding:28px 32px;border:1px solid #e2e8f0;">
            <p style="font-size:16px;color:#1e293b;">Estimado/a cliente de <strong>${matriz.empresa}</strong>,</p>
            <p style="color:#475569;">La revisión de su <strong>Matriz de Requisitos Legales</strong> ha sido completada por nuestro equipo de consultores especializados.</p>
            <div style="background:white;border-radius:8px;padding:20px;border:1px solid #e2e8f0;margin:20px 0;">
              <h2 style="color:#0f2a4a;font-size:15px;margin-top:0;border-bottom:2px solid #e2e8f0;padding-bottom:10px;">📋 Detalles del Informe</h2>
              <p style="color:#64748b;font-size:13px;margin:6px 0;"><strong>Empresa:</strong> ${matriz.empresa}</p>
              <p style="color:#64748b;font-size:13px;margin:6px 0;"><strong>Archivo analizado:</strong> ${matriz.nombre_archivo}</p>
              <p style="color:#64748b;font-size:13px;margin:6px 0;"><strong>Fecha de emisión:</strong> ${fechaEmision}</p>
              <p style="color:#64748b;font-size:13px;margin:6px 0;"><strong>Folio:</strong> NormaAI-${matriz.id.substring(0,8).toUpperCase()}</p>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#1e40af;font-size:13px;margin:0;">📎 <strong>El informe completo está adjunto en formato Word (.docx)</strong> en este correo. Puede abrirlo directamente con Microsoft Word o Google Docs.</p>
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
