// bcn-scraper.js — NormaAI Legal
// Scrapea el Diario Oficial de Chile diariamente y agrega normas relevantes a la KB
// Uso: node bcn-scraper.js [DD-MM-YYYY]

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const KEYWORDS = [
  'laboral', 'trabajo', 'trabajador', 'contrato', 'remuneración', 'despido',
  'subcontratación', 'jornada', 'sindicato', 'accidente del trabajo',
  'ambiental', 'medio ambiente', 'residuo', 'emisión', 'contaminación',
  'sustancia peligrosa', 'aguas', 'aire', 'suelo',
  'seguridad', 'salud ocupacional', 'higiene', 'riesgo laboral',
  'datos personales', 'protección de datos', 'privacidad', 'ciberseguridad',
  'ISO', 'norma técnica', 'calidad', 'certificación', 'acreditación',
  'anticorrupción', 'cumplimiento', 'compliance', 'soborno',
  'consumidor', 'responsabilidad', 'multa', 'sanción',
  'decreto supremo', 'ley', 'reglamento'
];

function esRelevante(titulo) {
  if (!titulo || titulo.length < 10) return false;
  const tituloLower = titulo.toLowerCase();
  return KEYWORDS.some(kw => tituloLower.includes(kw.toLowerCase()));
}

function fechaHoy() {
  const hoy = new Date();
  const dd = String(hoy.getDate()).padStart(2, '0');
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const yyyy = hoy.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function detectarTipo(titulo) {
  const t = titulo.toLowerCase();
  if (t.includes('decreto supremo')) return 'Decreto Supremo';
  if (t.includes('ley ')) return 'Ley';
  if (t.includes('resolución')) return 'Resolución';
  if (t.includes('reglamento')) return 'Reglamento';
  if (t.includes('extracto')) return 'Extracto';
  return 'Norma';
}

function detectarNormaISO(titulo) {
  const t = titulo.toLowerCase();
  if (t.includes('medio ambiente') || t.includes('ambiental')) return 'ISO 14001';
  if (t.includes('seguridad') || t.includes('salud ocupacional')) return 'ISO 45001';
  if (t.includes('datos personales') || t.includes('privacidad')) return 'ISO 27701';
  if (t.includes('anticorrupción') || t.includes('soborno')) return 'ISO 37001';
  if (t.includes('laboral') || t.includes('trabajo')) return 'ISO 45001';
  return 'General';
}

async function scrapearDiarioOficial(fecha) {
  const url = `https://www.diariooficial.interior.gob.cl/edicionelectronica/index.php?date=${fecha}`;
  console.log(`\nConsultando: ${url}`);

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'NormaAI-Legal/1.0 (contacto@normaai.cl)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 20000
    });

    const $ = cheerio.load(html);
    const normas = [];
    const vistas = new Set();

    $('a').each((i, el) => {
      const texto = $(el).text().trim().replace(/\s+/g, ' ');
      const href = $(el).attr('href') || '';
      if (texto.length < 15) return;
      if (vistas.has(texto)) return;
      vistas.add(texto);
      if (esRelevante(texto)) {
        const urlCompleta = href.startsWith('http')
          ? href
          : href.startsWith('/')
            ? `https://www.diariooficial.interior.gob.cl${href}`
            : `https://www.diariooficial.interior.gob.cl/${href}`;
        normas.push({ titulo: texto.substring(0, 300), url: urlCompleta, fecha });
      }
    });

    $('td, th').each((i, el) => {
      const texto = $(el).text().trim().replace(/\s+/g, ' ');
      if (texto.length < 15 || vistas.has(texto)) return;
      vistas.add(texto);
      if (esRelevante(texto)) {
        normas.push({ titulo: texto.substring(0, 300), url: url, fecha });
      }
    });

    console.log(`Encontradas ${normas.length} normas relevantes para fecha ${fecha}`);
    return normas;

  } catch (err) {
    console.error('Error scraping Diario Oficial:', err.message);
    return [];
  }
}

function detectarCategoria(titulo) {
  const t = titulo.toLowerCase();
  if (t.includes('ambiental') || t.includes('medio ambiente') || t.includes('residuo') || t.includes('emisión')) return 'ambiental';
  if (t.includes('seguridad') || t.includes('salud ocupacional') || t.includes('accidente') || t.includes('higiene')) return 'seguridad';
  if (t.includes('datos personales') || t.includes('privacidad') || t.includes('ciberseguridad') || t.includes('digital')) return 'digital';
  if (t.includes('laboral') || t.includes('trabajo') || t.includes('trabajador') || t.includes('remuneración')) return 'laboral';
  return 'general';
}

function generarResumen(titulo, fecha) {
  const tipo = detectarTipo(titulo);
  const categoria = detectarCategoria(titulo);
  const categoriaLabel = { ambiental: 'medio ambiente', seguridad: 'seguridad y salud ocupacional', digital: 'protección de datos y ciberseguridad', laboral: 'legislación laboral', general: 'normativa general' };
  return `${tipo} publicado en el Diario Oficial de Chile el ${fecha}, relevante para ${categoriaLabel[categoria] || 'normativa empresarial'}. Revisa el texto completo en el enlace.`;
}

async function insertarEnKB(normas) {
  let insertadas = 0;
  let omitidas = 0;
  let noticias = 0;

  for (const norma of normas) {
    try {
      const { data: existe } = await supabase
        .from('normaai_kb')
        .select('id')
        .ilike('titulo', norma.titulo.substring(0, 100))
        .maybeSingle();

      if (existe) {
        omitidas++;
        continue;
      }

      // 1. Insertar en KB
      const { error } = await supabase.from('normaai_kb').insert({
        titulo: norma.titulo.substring(0, 200),
        descripcion: `Publicado en el Diario Oficial de Chile el ${norma.fecha}. ${norma.titulo}`,
        cuerpo_legal: `Diario Oficial Chile — ${norma.fecha}`,
        norma_iso: detectarNormaISO(norma.titulo),
        tipo: detectarTipo(norma.titulo),
        url_bcn: norma.url,
        vigente: true
      });

      if (error) {
        console.error('Error insertando en KB:', error.message);
      } else {
        console.log(`KB insertada: ${norma.titulo.substring(0, 70)}...`);
        insertadas++;

        // 2. Crear noticia automática en normaai_noticias
        const { error: errNoticia } = await supabase.from('normaai_noticias').insert({
          titulo: norma.titulo.substring(0, 200),
          resumen: generarResumen(norma.titulo, norma.fecha),
          categoria: detectarCategoria(norma.titulo),
          url: norma.url,
          publicada: true
        });

        if (errNoticia) {
          console.error('Error creando noticia:', errNoticia.message);
        } else {
          console.log(`Noticia creada: ${norma.titulo.substring(0, 50)}...`);
          noticias++;
        }
      }

      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.error('Error procesando norma:', err.message);
    }
  }

  console.log(`\nResumen: ${insertadas} normas en KB, ${noticias} noticias creadas, ${omitidas} ya existían`);
  return insertadas;
}

async function ejecutar() {
  console.log('NormaAI BCN Scraper v1.0');
  const fecha = process.argv[2] || fechaHoy();
  console.log(`Fecha objetivo: ${fecha}`);
  const normas = await scrapearDiarioOficial(fecha);
  if (normas.length === 0) {
    console.log('No se encontraron normas relevantes para esta fecha.');
    process.exit(0);
  }
  await insertarEnKB(normas);
  console.log('Proceso completado.');
}

ejecutar().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
