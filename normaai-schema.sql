-- ============================================================
--  NORMAAI LEGAL — Schema Supabase
--  Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. TABLA DE CLIENTES
-- Vincula usuarios de Supabase Auth con datos del cliente
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  empresa     TEXT,
  rut         TEXT,
  email       TEXT NOT NULL,
  activo      BOOLEAN DEFAULT true,
  plan        TEXT DEFAULT 'anual',
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin   DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE NOTICIAS
-- Tú publicas noticias desde la plataforma interna
CREATE TABLE IF NOT EXISTS noticias (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo      TEXT NOT NULL,
  resumen     TEXT,
  contenido   TEXT,
  categoria   TEXT DEFAULT 'General',
  url         TEXT,
  video_url   TEXT,
  publicada   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE USO DEL AGENTE
-- Controla las consultas mensuales por usuario
CREATE TABLE IF NOT EXISTS uso_agente (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mes         TEXT NOT NULL,  -- formato "2026-05"
  consultas   INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mes)
);

-- ── Row Level Security ────────────────────────────────────────

-- Clientes: solo pueden ver su propio registro
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cliente_propio" ON clientes
  FOR SELECT USING (auth.uid() = user_id);

-- Noticias: todos los autenticados pueden ver las publicadas
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "noticias_publicas" ON noticias
  FOR SELECT USING (publicada = true);

-- Uso agente: cada usuario ve y actualiza solo el suyo
ALTER TABLE uso_agente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uso_propio" ON uso_agente
  FOR ALL USING (auth.uid() = user_id);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_noticias_publicada ON noticias(publicada, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uso_agente_user_mes ON uso_agente(user_id, mes);

-- ── Función para activar un nuevo cliente ────────────────────
-- Úsala desde la plataforma interna para crear acceso a un cliente nuevo
CREATE OR REPLACE FUNCTION activar_cliente(
  p_email    TEXT,
  p_nombre   TEXT,
  p_empresa  TEXT,
  p_password TEXT
) RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- El usuario se crea desde Supabase Auth (via plataforma interna)
  -- Esta función solo registra en la tabla clientes
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN 'ERROR: Usuario no encontrado en Auth. Créalo primero.';
  END IF;

  INSERT INTO clientes (user_id, nombre, empresa, email, activo)
  VALUES (v_user_id, p_nombre, p_empresa, p_email, true)
  ON CONFLICT (user_id) DO UPDATE SET activo = true, updated_at = NOW();

  RETURN 'OK: Cliente activado correctamente.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Datos de ejemplo ─────────────────────────────────────────
INSERT INTO noticias (titulo, resumen, categoria, url, publicada) VALUES
(
  'Actualización Ley 21.643: Nueva normativa sobre acoso laboral',
  'El Ministerio del Trabajo publicó nuevas orientaciones sobre la aplicación de la Ley Karin que regula el acoso laboral y sexual en el trabajo. Las empresas certificadas ISO 45001 deben revisar sus procedimientos internos.',
  'Laboral',
  'https://www.bcn.cl/leychile',
  true
),
(
  'DS 57/2021 Reglamento SSO: Puntos clave para auditorías ISO 45001',
  'Recordatorio sobre los requisitos del Decreto Supremo 57 y su aplicación en los sistemas de gestión de seguridad y salud en el trabajo. Especialmente relevante para empresas en proceso de certificación.',
  'Seguridad',
  'https://www.bcn.cl/leychile',
  true
),
(
  'Ley 21.719 Protección de Datos Personales: Entrada en vigencia',
  'Chile actualiza su marco normativo de protección de datos. Empresas con ISO 27001 y 27701 deben revisar el cumplimiento de los nuevos requisitos antes del plazo establecido.',
  'Digital',
  'https://www.bcn.cl/leychile',
  true
);
