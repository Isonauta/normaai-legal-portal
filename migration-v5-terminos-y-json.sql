-- migration-v5-terminos-y-json.sql
-- Ejecutar en: Supabase → SQL Editor

-- Fix 0.2: persistencia de aceptación de términos
ALTER TABLE normaai_clientes
ADD COLUMN IF NOT EXISTS terminos_aceptados_en TIMESTAMPTZ;

-- Fix 0.3: columna para el JSON estructurado del informe (generador Word DEKRA)
ALTER TABLE normaai_matrices
ADD COLUMN IF NOT EXISTS informe_json JSONB;

-- Índice para consultas por estado de términos (opcional, útil para admin)
CREATE INDEX IF NOT EXISTS idx_normaai_clientes_terminos
  ON normaai_clientes(terminos_aceptados_en)
  WHERE terminos_aceptados_en IS NOT NULL;
