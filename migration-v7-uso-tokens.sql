-- migration-v7-uso-tokens.sql
-- Ejecutar en Supabase → SQL Editor
-- Agrega tracking real de tokens y costo estimado por consulta del agente,
-- para reemplazar las estimaciones manuales con datos reales de uso.

ALTER TABLE uso_agente
  ADD COLUMN IF NOT EXISTS tokens_input  BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_output BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_usd     NUMERIC(10,4) DEFAULT 0;

COMMENT ON COLUMN uso_agente.tokens_input  IS 'Suma acumulada de input_tokens (respuesta.usage) del mes';
COMMENT ON COLUMN uso_agente.tokens_output IS 'Suma acumulada de output_tokens (respuesta.usage) del mes';
COMMENT ON COLUMN uso_agente.costo_usd     IS 'Costo estimado acumulado del mes en USD, calculado con el pricing del modelo usado en cada consulta';
