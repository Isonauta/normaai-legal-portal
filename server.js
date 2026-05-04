const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas explícitas para páginas HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// ── Clientes de servicios ──────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    
    // Verificar que el usuario esté activo en la tabla de clientes
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
//  NOTICIAS — Obtener (todos ven lo mismo)
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
//  AGENTE IA — Chat con normativa chilena
// ══════════════════════════════════════════════════════════════
app.post('/api/agente', verificarToken, async (req, res) => {
  const { mensaje, historial = [] } = req.body;
  if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });

  // Verificar límite de uso mensual
  const mesActual = new Date().toISOString().slice(0, 7); // "2026-05"
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
    // Buscar normativa BCN relevante
    let contexto_bcn = '';
    try {
      const palabrasClave = mensaje.split(' ').slice(0, 3).join('+');
      const bcnUrl = `https://www.bcn.cl/leychile/consulta/listaResultadosSimple?tipDocumento=&numDocumento=&titulo=${encodeURIComponent(mensaje.slice(0,50))}&organism=&_=1`;
      contexto_bcn = `Fuente: Biblioteca del Congreso Nacional de Chile (bcn.cl/leychile)`;
    } catch {
      contexto_bcn = 'Biblioteca del Congreso Nacional de Chile disponible en bcn.cl/leychile';
    }

    // Construir historial para Claude
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

    // Registrar uso
    await supabase.from('uso_agente').upsert({
      user_id: req.user.id,
      mes: mesActual,
      consultas: consultasUsadas + 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,mes' });

    // Guardar en historial
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
//  HISTORIAL — Guardar mensaje
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

// ══════════════════════════════════════════════════════════════
//  HISTORIAL — Obtener sesiones del usuario
// ══════════════════════════════════════════════════════════════
app.get('/api/historial/sesiones', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('normaai_conversaciones')
      .select('sesion_id, created_at, contenido, tiene_documento, nombre_documento')
      .eq('user_id', req.user.id)
      .eq('rol', 'user')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Agrupar por sesion_id y obtener primera pregunta
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

// ══════════════════════════════════════════════════════════════
//  HISTORIAL — Obtener mensajes de una sesión
// ══════════════════════════════════════════════════════════════
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
//  DOCUMENTOS — Analizar PDF/Word (NO Excel)
// ══════════════════════════════════════════════════════════════
app.post('/api/analizar-documento', verificarToken, async (req, res) => {
  const { nombre, contenido_texto, sesion_id } = req.body;
  
  // Bloquear Excel/CSV explícitamente
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

    // Registrar uso
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
