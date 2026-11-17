-- migration-v8-ambito-compliance.sql
-- Ejecutar en Supabase → SQL Editor
-- Agrega el campo "ambito" a normaai_requisitos, para agrupar la matriz
-- por área de compliance (ej: Laboral, Seguridad, Medio Ambiente, Penal,
-- Tributario, Internacional, Financiero, Tecnológico) en vez de mostrar
-- solo una lista plana por cuerpo legal. Es texto libre (no un listado
-- fijo) porque cada cliente puede necesitar categorías distintas según
-- su rubro y lo que su matriz original ya traía clasificado.

ALTER TABLE normaai_requisitos
  ADD COLUMN IF NOT EXISTS ambito TEXT;

COMMENT ON COLUMN normaai_requisitos.ambito IS 'Área de compliance del requisito (ej: Laboral, Seguridad, Medio Ambiente, Penal, Tributario, Internacional, Financiero, Tecnológico). Texto libre, usado para agrupar/filtrar en el dashboard. NULL para requisitos sin clasificar (se muestran bajo "Sin ámbito").';
