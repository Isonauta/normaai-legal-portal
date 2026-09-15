-- demo-data-epiroc-planes.sql
-- Planes de acción demo para Epiroc Chile, uno por cada uno de los 2
-- requisitos "NO cumple" (gestión de subcontratistas), para que se vean
-- en la vista "Agenda". Ejecutar DESPUÉS de demo-data-epiroc.sql, una
-- sola vez (no es idempotente: si se corre dos veces, duplica los
-- planes).
--
-- INSTRUCCIONES: usa el mismo UUID que en demo-data-epiroc.sql y
-- ejecuta en Supabase → SQL Editor.

DO $$
DECLARE
  v_uid UUID := 'c928409f-d7c4-4d17-bb70-baa0466d5bad'::UUID;
BEGIN

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Implementar procedimiento de acreditación de obligaciones laborales y previsionales de contratistas y subcontratistas de los 3 Customer Centers', 'Gerencia de Operaciones', '2026-10-10', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DFL N°1 — Código del Trabajo' AND articulo = 'Art. 183-A (incorporado por Ley N°20.123)';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Formalizar matriz de gestión de SST compartida con contratistas y subcontratistas (obras/faenas/servicios) conforme al D.S. N°76', 'Jefe HSE', '2026-10-20', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'D.S. N°76 — Gestión de SST en obras con contratistas (Art. 66 bis, Ley N°16.744)' AND articulo = 'Art. 3';

END $$;
