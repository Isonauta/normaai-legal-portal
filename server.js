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
        id: data.user.id,
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
      .from('normaai_noticias')
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


// ── Leer Excel ───────────────────────────────────────────────
function leerExcel(buffer) {
  const XLSX = require('xlsx');
  const wb = XLSX.read(buffer, { type: 'buffer' });
  return wb.SheetNames.map(name => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const articulos = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const art  = String(r[1] || '').trim();
      const desc = String(r[2] || '').trim();
      const como = String(r[3] || '').trim();
      const cumple = String(r[4] || '').trim();
      const resp = String(r[5] || '').trim();
      if (art && desc && desc.length > 10) {
        articulos.push({ art, desc, como, cumple, responsable: resp });
      }
    }
    return { cuerpoLegal: name, articulos };
  }).filter(h => h.articulos.length > 0);
}

// ── Generador de informe HTML ─────────────────────────────────
function generarInformeHTML({ datosExcel, totalCuerpos, totalRequisitos, cumplen, noCumplen, parcial, pctCumplimiento, empresa, normas_iso, alcance_sistema, sitios_trabajo, fechaHoy }) {
  const pct = parseFloat(pctCumplimiento);
  const nivel = pct >= 80 ? 'ALTO' : pct >= 50 ? 'MEDIO' : 'BAJO';
  const nivelColor = pct >= 80 ? '#1a7a4a' : pct >= 50 ? '#b45309' : '#b91c1c';
  const nivelBg = pct >= 80 ? '#f0fdf4' : pct >= 50 ? '#fffbeb' : '#fef2f2';
  const circum = (2 * Math.PI * 48).toFixed(1);
  const offset = (circum * (1 - pct / 100)).toFixed(1);

  const resumenTxt = pct === 100
    ? 'La matriz presenta cumplimiento ÓPTIMO del 100% con los ' + totalRequisitos + ' requisitos en conformidad total. No se identificaron brechas.'
    : 'La matriz presenta ' + noCumplen + ' brechas confirmadas y ' + parcial + ' requisitos sin verificar de un total de ' + totalRequisitos + '. Se recomienda atención antes de cualquier auditoría.';

  const recs = pct === 100
    ? ['Mantener revisión semestral de cada cuerpo legal.', 'Designar responsable por norma para seguimiento de cambios vía BCN.', 'Documentar evidencia con trazabilidad de fechas.', 'Sincronizar con actualizaciones del Diario Oficial de Chile.']
    : ['Documentar evidencia para todos los requisitos sin verificar.', 'Asignar responsables a cada artículo con brecha.', 'Establecer plan de acción con fechas comprometidas.', 'Revisar requisitos críticos con asesoría legal especializada.'];

  const recHTML = recs.map(function(r) { return '<li style="margin-bottom:.3rem;color:#374151;">' + r + '</li>'; }).join('');

  const seccionesLeyes = datosExcel.map(function(hoja) {
    const reqs = hoja.articulos;
    if (!reqs || reqs.length === 0) return '';
    const leyC = reqs.filter(function(a) { return ['SI','SÍ','X','TRUE'].includes(a.cumple.toUpperCase()); }).length;
    const leyNC = reqs.filter(function(a) { return ['NO','FALSE'].includes(a.cumple.toUpperCase()); }).length;
    const leySD = reqs.length - leyC - leyNC;
    const leyPct = reqs.length > 0 ? ((leyC / reqs.length) * 100).toFixed(1) : '0.0';
    const c = leyNC > 0 ? '#b91c1c' : leySD > 0 ? '#b45309' : '#1a7a4a';
    const bg = leyNC > 0 ? '#fef2f2' : leySD > 0 ? '#fffbeb' : '#f0fdf4';
    const sem = leyNC > 0 ? '🔴' : leySD > 0 ? '🟡' : '🟢';

    const cards = reqs.map(function(r) {
      const esCumple = ['SI','SÍ','X','TRUE'].includes(r.cumple.toUpperCase());
      const esNoCumple = ['NO','FALSE'].includes(r.cumple.toUpperCase());
      const estColor = esCumple ? '#15803d' : esNoCumple ? '#b91c1c' : '#a16207';
      const estBg = esCumple ? '#dcfce7' : esNoCumple ? '#fee2e2' : '#fef9c3';
      const estTxt = esCumple ? '✓ Cumple' : esNoCumple ? '✗ No cumple' : '⚠ Sin verificar';
      const comoHtml = r.como && r.como.trim()
        ? r.como
        : '<span style="color:#9ca3af;font-style:italic;">No especificado — requiere documentar evidencia</span>';
      const riesgo = esNoCumple
        ? '<span style="background:#fee2e2;color:#b91c1c;padding:.1rem .4rem;border-radius:3px;font-size:.68rem;font-weight:700;">RIESGO ALTO</span>'
        : (!r.como || !r.como.trim())
          ? '<span style="background:#fef9c3;color:#a16207;padding:.1rem .4rem;border-radius:3px;font-size:.68rem;font-weight:700;">RIESGO MEDIO</span>'
          : '';
      const respHtml = r.responsable ? '<span style="font-size:.68rem;color:#6b7280;margin-left:auto;">👤 ' + r.responsable + '</span>' : '';

      return '<div style="background:#fafafa;border-radius:6px;padding:.7rem .9rem;border-left:3px solid ' + estColor + ';margin-bottom:.5rem;">' +
        '<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.35rem;">' +
          '<span style="font-weight:700;font-size:.82rem;color:' + estColor + ';">Art. ' + (r.art || 'N/A') + '</span>' +
          '<span style="background:' + estBg + ';color:' + estColor + ';padding:.15rem .45rem;border-radius:4px;font-size:.68rem;font-weight:600;">' + estTxt + '</span>' +
          riesgo + respHtml +
        '</div>' +
        '<div style="font-size:.82rem;color:#374151;margin-bottom:.35rem;">' + (r.desc ? r.desc.substring(0, 300) : '') + '</div>' +
        '<div style="font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.2rem;">Cómo se cumple / Evidencia:</div>' +
        '<div style="font-size:.82rem;color:#4b5563;">' + comoHtml + '</div>' +
      '</div>';
    }).join('');

    return '<div style="margin-bottom:1.3rem;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;page-break-inside:avoid;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:.7rem 1rem;flex-wrap:wrap;gap:.4rem;background:' + bg + ';border-left:4px solid ' + c + ';">' +
        '<div>' +
          '<div style="font-weight:700;font-size:.9rem;font-family:Arial,sans-serif;color:' + c + ';">' + sem + ' ' + hoja.cuerpoLegal + '</div>' +
          '<div style="font-size:.72rem;color:#6b7280;margin-top:.1rem;">' + reqs.length + ' requisitos</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;">' +
          '<span style="background:#dcfce7;color:#15803d;padding:.18rem .5rem;border-radius:4px;font-size:.68rem;font-weight:600;">✓ ' + leyC + '</span>' +
          '<span style="background:#fee2e2;color:#b91c1c;padding:.18rem .5rem;border-radius:4px;font-size:.68rem;font-weight:600;">✗ ' + leyNC + '</span>' +
          '<span style="background:#fef9c3;color:#a16207;padding:.18rem .5rem;border-radius:4px;font-size:.68rem;font-weight:600;">⚠ ' + leySD + '</span>' +
          '<span style="font-weight:700;font-size:.9rem;font-family:Arial,sans-serif;color:' + c + ';">' + leyPct + '%</span>' +
        '</div>' +
      '</div>' +
      '<div style="padding:.5rem .8rem .8rem;">' + cards + '</div>' +
    '</div>';
  }).join('');

  const kpisHTML = [
    {n: totalRequisitos, l: 'Requisitos', c: '#1f2937'},
    {n: cumplen, l: 'Cumplen', c: '#15803d'},
    {n: noCumplen, l: 'Brechas', c: '#b91c1c'},
    {n: parcial, l: 'Sin verificar', c: '#a16207'},
    {n: totalCuerpos, l: 'Cuerpos legales', c: '#1f2937'}
  ].map(function(k) {
    return '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:.9rem .6rem;text-align:center;background:#fafafa;">' +
      '<div style="font-size:1.7rem;font-weight:700;color:' + k.c + ';">' + k.n + '</div>' +
      '<div style="font-size:.62rem;color:#6b7280;margin-top:.3rem;text-transform:uppercase;letter-spacing:.04em;">' + k.l + '</div>' +
    '</div>';
  }).join('');

  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '<title>Informe Cumplimiento — ' + empresa + '</title>\n' +
    '<style>\n' +
    '*{box-sizing:border-box;margin:0;padding:0;}\n' +
    'body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#1f2937;background:#fff;line-height:1.6;}\n' +
    '.page{max-width:900px;margin:0 auto;padding:1.5cm;}\n' +
    '@media print{.portada{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.kpi{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}\n' +
    '@page{margin:1.2cm 1.5cm;size:A4;}\n' +
    '</style>\n</head>\n<body>\n<div class="page">\n\n' +

    // PORTADA
    '<div style="background:#0d2144;color:white;border-radius:10px;padding:2.5rem;margin-bottom:2rem;">' +
      '<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:1.8rem;">' +
        '<div style="width:38px;height:38px;background:#1a6cf8;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">⚖</div>' +
        '<div><div style="font-weight:700;font-size:1.1rem;">NormaAI Legal</div><div style="font-size:.62rem;color:#c9a84c;text-transform:uppercase;letter-spacing:.1em;">by Procesus</div></div>' +
      '</div>' +
      '<h1 style="font-size:1.8rem;font-weight:700;line-height:1.2;margin-bottom:.5rem;">Informe de Cumplimiento<br><span style="color:#c9a84c;">Normativo</span></h1>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem 1.5rem;margin-top:1.5rem;font-size:.82rem;">' +
        '<div><div style="color:#8a96a8;font-size:.65rem;text-transform:uppercase;letter-spacing:.07em;">Empresa</div><div style="color:#e2e8f0;margin-top:.1rem;">' + empresa + '</div></div>' +
        '<div><div style="color:#8a96a8;font-size:.65rem;text-transform:uppercase;letter-spacing:.07em;">Normas ISO</div><div style="color:#e2e8f0;margin-top:.1rem;">' + (normas_iso || 'No especificadas') + '</div></div>' +
        '<div><div style="color:#8a96a8;font-size:.65rem;text-transform:uppercase;letter-spacing:.07em;">Alcance</div><div style="color:#e2e8f0;margin-top:.1rem;">' + (alcance_sistema || 'No especificado') + '</div></div>' +
        '<div><div style="color:#8a96a8;font-size:.65rem;text-transform:uppercase;letter-spacing:.07em;">Sitios</div><div style="color:#e2e8f0;margin-top:.1rem;">' + (sitios_trabajo || 'No especificados') + '</div></div>' +
        '<div><div style="color:#8a96a8;font-size:.65rem;text-transform:uppercase;letter-spacing:.07em;">Fecha análisis</div><div style="color:#e2e8f0;margin-top:.1rem;">' + fechaHoy + '</div></div>' +
        '<div><div style="color:#8a96a8;font-size:.65rem;text-transform:uppercase;letter-spacing:.07em;">Nivel</div><div style="color:#c9a84c;font-weight:700;margin-top:.1rem;">' + nivel + ' — ' + pctCumplimiento + '%</div></div>' +
      '</div>' +
      '<div style="display:inline-block;margin-top:1.2rem;border:1px solid rgba(201,168,76,0.5);color:#c9a84c;padding:.25rem .7rem;border-radius:4px;font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;">🔒 Confidencial · NormaAI Legal · Procesus</div>' +
    '</div>' +

    // KPIs
    '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:.7rem;margin-bottom:1.5rem;">' + kpisHTML + '</div>' +

    // GAUGE
    '<div style="display:flex;align-items:center;gap:1.5rem;background:' + nivelBg + ';border:1px solid ' + nivelColor + '40;border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">' +
      '<svg width="110" height="110" viewBox="0 0 110 110">' +
        '<circle cx="55" cy="55" r="48" fill="none" stroke="#e5e7eb" stroke-width="9"/>' +
        '<circle cx="55" cy="55" r="48" fill="none" stroke="' + nivelColor + '" stroke-width="9" stroke-dasharray="' + circum + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" transform="rotate(-90 55 55)"/>' +
        '<text x="55" y="51" text-anchor="middle" font-size="18" font-weight="700" fill="' + nivelColor + '" font-family="Arial">' + pctCumplimiento + '%</text>' +
        '<text x="55" y="65" text-anchor="middle" font-size="7.5" fill="#6b7280" font-family="Arial">cumplimiento</text>' +
      '</svg>' +
      '<div style="flex:1;min-width:200px;">' +
        '<div style="font-size:1.2rem;font-weight:700;color:' + nivelColor + ';margin-bottom:.3rem;">Nivel ' + nivel + '</div>' +
        '<p style="font-size:.85rem;color:#374151;line-height:1.6;">' + resumenTxt + '</p>' +
      '</div>' +
    '</div>' +

    // RESUMEN
    '<div style="font-size:.95rem;font-weight:700;color:#0d2144;border-bottom:2px solid #1a6cf8;padding-bottom:.35rem;margin:1.8rem 0 1rem;">1. Resumen Ejecutivo</div>' +
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem 1.2rem;font-size:.87rem;line-height:1.7;margin-bottom:1.5rem;">' +
      '<p>' + resumenTxt + '</p>' +
      '<p style="font-weight:700;margin-top:.7rem;font-size:.82rem;">Recomendaciones generales:</p>' +
      '<ul style="padding-left:1.2rem;margin-top:.5rem;">' + recHTML + '</ul>' +
    '</div>' +

    // DETALLE
    '<div style="font-size:.95rem;font-weight:700;color:#0d2144;border-bottom:2px solid #1a6cf8;padding-bottom:.35rem;margin:1.8rem 0 1rem;">2. Análisis Detallado por Cuerpo Legal</div>' +
    seccionesLeyes +

    // PIE
    '<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;text-align:center;font-size:.68rem;color:#9ca3af;">' +
      'Informe generado por <strong>NormaAI Legal · Procesus</strong> · ' + fechaHoy + ' · Confidencial<br>' +
      'Este documento es de carácter orientativo. Para validación oficial contacte a Procesus.' +
    '</div>' +

    '\n</div>\n</body>\n</html>';
}



// ── Cliente: Subir matriz ─────────────────────────────────────
app.post('/api/matriz/subir', verificarToken, upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const { nombre_empresa, normas_iso, alcance_sistema, sitios_trabajo } = req.body;
    const archivo = req.file;
    const ext = archivo.originalname.split('.').pop().toLowerCase();
    const fechaHoy = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

    const { data: cliente } = await supabase
      .from('normaai_clientes')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const empresa = nombre_empresa || cliente?.empresa || 'Sin nombre';
    const contextoEmpresa = `
DATOS DE LA EMPRESA:
- Empresa: ${empresa}
- Normas ISO: ${normas_iso || 'No especificadas'}
- Alcance del sistema: ${alcance_sistema || 'No especificado'}
- Sitios / Lugares de trabajo: ${sitios_trabajo || 'No especificados'}
`

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

        // Generar HTML estructurado directamente desde los datos de la matriz
        informeIA = generarInformeHTML({
          datosExcel, totalCuerpos, totalRequisitos,
          cumplen, noCumplen, parcial, pctCumplimiento,
          empresa, normas_iso, alcance_sistema, sitios_trabajo, fechaHoy
        });

      } else if (ext === 'pdf') {
        const archivoBase64 = archivo.buffer.toString('base64');
        const mensajeIA = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: archivoBase64 } },
              { type: 'text', text: `Eres un analizador experto de matrices de requisitos legales. Analiza el PDF adjunto que contiene una matriz de cumplimiento legal y extrae TODOS los datos para generar un informe HTML completo.

${contextoEmpresa}
Fecha de revisión: ${fechaHoy}

INSTRUCCIONES CRÍTICAS:
1. Lee cada fila de la matriz e identifica: cuerpo legal, artículo, descripción del requisito, cómo se cumple/evidencia, estado de cumplimiento (SI/NO/vacío), y responsable.
2. Agrupa los requisitos por cuerpo legal.
3. Para cada requisito sin evidencia documentada, márcalo como riesgo medio. Para cada NO cumple, marca como riesgo alto.
4. Genera el informe ÚNICAMENTE como HTML válido, sin markdown, sin explicaciones adicionales.

El HTML debe seguir EXACTAMENTE esta estructura:

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe Cumplimiento — EMPRESA</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#1f2937;background:#fff;line-height:1.6;}
.page{max-width:900px;margin:0 auto;padding:1.5cm;}
@media print{.portada{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
@page{margin:1.2cm 1.5cm;size:A4;}
</style>
</head>
<body>
<div class="page">

[PORTADA con fondo #0d2144, logo NormaAI Legal by Procesus, título "Informe de Cumplimiento Normativo", datos de empresa/normas/alcance/sitios/fecha/nivel]

[5 KPIs en grid: total requisitos, cumplen, brechas, sin verificar, cuerpos legales]

[Gauge SVG circular con % de cumplimiento y nivel ALTO/MEDIO/BAJO]

[Sección "1. Resumen Ejecutivo" con análisis y recomendaciones]

[Sección "2. Análisis Detallado por Cuerpo Legal" — para cada cuerpo legal:
  - Header con semáforo 🔴🟡🟢, nombre, estadísticas y % 
  - Para cada artículo: tarjeta con Art.X, badge estado (✓ Cumple / ✗ No cumple / ⚠ Sin verificar), badge riesgo si aplica, descripción del requisito, y evidencia/cómo se cumple]

[Pie de página: "Informe generado por NormaAI Legal · Procesus · [fecha] · Confidencial"]

</div>
</body>
</html>

IMPORTANTE: Responde SOLO con el HTML completo. Sin texto antes ni después. Sin bloques de código markdown.` }
            ]
          }]
        });
        // Limpiar posibles bloques markdown que el modelo pueda agregar
        let htmlRaw = mensajeIA.content[0].text.trim();
        if (htmlRaw.startsWith('\`\`\`')) {
          htmlRaw = htmlRaw.replace(/^```html?\n?/m, '').replace(/\n?```$/m, '').trim();
        }
        informeIA = htmlRaw;

      } else {
        informeIA = `## RECEPCIÓN CONFIRMADA\n\nMatriz recibida el ${fechaHoy}.\n- Archivo: ${archivo.originalname}\n- Empresa: ${empresa}\n\n## PRÓXIMOS PASOS\n\nEl equipo de Procesus analizará el documento y enviará el informe certificado en 24-48 horas hábiles.`;
      }
    } catch (e) {
      console.error('Error IA completo:', e.message, e.stack);
      informeIA = `Matriz recibida el ${fechaHoy}. El equipo de Procesus realizará el análisis en las próximas 24-48 horas hábiles.`;
    }

    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .insert({
        user_id: req.user.id,
        empresa: empresa,
        nombre_archivo: archivo.originalname,
        contenido_texto: `${ext.toUpperCase()}: ${archivo.originalname} (${(archivo.size/1024).toFixed(1)} KB)\n${contextoEmpresa}`,
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
              <p><strong>Normas ISO:</strong> ${normas_iso || 'No especificadas'}</p>
              <p><strong>Alcance:</strong> ${alcance_sistema || 'No especificado'}</p>
              <p><strong>Sitios:</strong> ${sitios_trabajo || 'No especificados'}</p>
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
// ── Cliente: Ver informe HTML (acepta token por query param para iframe/nueva pestaña)
app.get('/api/matriz/:id/informe-html', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token) return res.status(401).send('<h3>Sin autorización</h3>');
  let userId;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).send('<h3>Token inválido</h3>');
    userId = user.id;
  } catch(e) { return res.status(401).send('<h3>Error de autenticación</h3>'); }
  try {
    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .select('informe_ia, estado, empresa, id')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !matriz) return res.status(404).send('<h3>Informe no encontrado</h3>');
    if (matriz.estado !== 'enviado' && matriz.estado !== 'aprobado') {
      return res.status(400).send('<h3>El informe aún no está disponible</h3>');
    }
    if (!matriz.informe_ia) return res.status(404).send('<h3>Informe no generado</h3>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(matriz.informe_ia);
  } catch (err) {
    res.status(500).send('<h3>Error al cargar informe</h3>');
  }
});

// ── Admin: Ver informe HTML ───────────────────────────────────
app.get('/api/admin/matrices/:id/informe-html', async (req, res) => {
  const tkn = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!tkn) return res.status(401).send('<h3>Sin autorizacion</h3>');
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(tkn);
    if (authErr || !user) return res.status(401).send('<h3>Token invalido</h3>');
    const { data: cl } = await supabase.from('normaai_clientes').select('rol').eq('user_id', user.id).single();
    if (!cl || cl.rol !== 'admin') return res.status(403).send('<h3>Acceso denegado</h3>');
  } catch(e) { return res.status(401).send('<h3>Error auth</h3>'); }
  try {
    const { data: matriz, error } = await supabase
      .from('normaai_matrices')
      .select('informe_ia, empresa, id, estado')
      .eq('id', req.params.id)
      .single();

    if (error || !matriz) return res.status(404).json({ error: 'No encontrada' });
    if (!matriz.informe_ia) return res.status(404).json({ error: 'Informe no generado' });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(matriz.informe_ia);
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar informe' });
  }
});

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
// ── Admin: Crear usuario ─────────────────────────────────────
app.post('/api/admin/clientes/crear', verificarAdmin, async (req, res) => {
  const { nombre, email, password, empresa, rol, fecha_fin } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }
  try {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
      }
      return res.status(400).json({ error: 'Error al crear usuario: ' + authError.message });
    }

    const userId = authData.user.id;

    // 2. Registrar en normaai_clientes
    const { error: clienteError } = await supabase.from('normaai_clientes').insert({
      user_id: userId,
      nombre,
      empresa: empresa || '',
      email,
      rol: rol || 'cliente',
      activo: true,
      fecha_fin: fecha_fin || null
    });

    if (clienteError) {
      // Revertir: eliminar el usuario de Auth si falla el insert
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Error al registrar cliente: ' + clienteError.message });
    }

    // 3. Enviar email de bienvenida
    try {
      const transporter = crearTransporter();
      await transporter.sendMail({
        from: `"NormaAI Legal" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🎉 Bienvenido a NormaAI Legal — Tus credenciales de acceso',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0f2a4a;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:1.5rem;">⚖ NormaAI Legal</h1>
              <p style="color:#c9a84c;margin:4px 0 0;font-size:.85rem;">by Procesus</p>
            </div>
            <div style="background:#f8fafc;padding:28px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
              <h2 style="color:#0f2a4a;margin:0 0 16px;">Hola ${nombre}, bienvenido/a 👋</h2>
              <p style="color:#475569;">Tu acceso a <strong>NormaAI Legal</strong> ha sido activado. Aquí están tus credenciales:</p>
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="margin:0 0 8px;"><strong>🌐 Plataforma:</strong> <a href="https://legal.normaai.cl" style="color:#1a6cf8;">legal.normaai.cl</a></p>
                <p style="margin:0 0 8px;"><strong>📧 Email:</strong> ${email}</p>
                <p style="margin:0;"><strong>🔑 Contraseña:</strong> ${password}</p>
              </div>
              <p style="color:#64748b;font-size:.88rem;">Por seguridad, te recomendamos cambiar tu contraseña después del primer acceso.</p>
              <div style="text-align:center;margin-top:24px;">
                <a href="https://legal.normaai.cl" style="background:#1a6cf8;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
                  Acceder a NormaAI →
                </a>
              </div>
              <hr style="border:1px solid #e2e8f0;margin:24px 0;">
              <p style="color:#94a3b8;font-size:.78rem;text-align:center;">NormaAI Legal · by Procesus · contacto@normaai.cl</p>
            </div>
          </div>`
      });
    } catch (emailErr) {
      console.error('Error email bienvenida:', emailErr.message);
      // No falla el proceso si el email falla
    }

    res.json({ ok: true, mensaje: `Usuario ${nombre} creado exitosamente. Se envió email de bienvenida a ${email}.`, user_id: userId });
  } catch (err) {
    console.error('[crear-cliente]', err.message);
    res.status(500).json({ error: 'Error inesperado: ' + err.message });
  }
});

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

        await transporter.sendMail({
      from: `"NormaAI Legal — Procesus" <${process.env.GMAIL_USER}>`,
      to: emailCliente,
      subject: `✅ Informe de Cumplimiento Normativo listo — ${matriz.empresa}`,
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
              <p style="color:#1e40af;font-size:13px;margin:0;">📎 <strong>El informe completo está disponible en la plataforma NormaAI Legal</strong> en este correo. Puede abrirlo directamente con Microsoft Word o Google Docs.</p>
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
