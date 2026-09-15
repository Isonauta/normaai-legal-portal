-- demo-data-solucorp-planes.sql
-- Planes de acción demo para Solucorp, uno por cada uno de los 4
-- requisitos "NO cumple", para que se vean en la vista "Agenda"
-- (septiembre-octubre 2026). Ejecutar DESPUÉS de demo-data-solucorp.sql,
-- una sola vez (no es idempotente: si se corre dos veces, duplica los
-- planes).
--
-- INSTRUCCIONES: usa el mismo UUID que en demo-data-solucorp.sql y
-- ejecuta en Supabase → SQL Editor.

DO $$
DECLARE
  v_uid UUID := '68475e2b-d614-416e-9d80-79cbf1c2326e'::UUID;
BEGIN

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Contratar monitoreo de ruido y calidad de aire (COV) en líneas de impresión y mejorar sistema de ventilación', 'Jefe HSE', '2026-09-30', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo' AND articulo = 'Art. 53°, 75° y 82° — Ruido y ventilación en líneas de impresión';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Consolidar registro de solventes y tintas consumidos y presentar declaración de emisiones COV al RETC', 'Gerencia Ambiental', '2026-10-15', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'RETC — Registro de Emisiones y Transferencia de Contaminantes' AND articulo = 'Declaración de emisiones atmosféricas por compuestos orgánicos volátiles (COV)';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Actualizar hojas de datos de seguridad, señalización y matriz de compatibilidad química de la bodega de solventes y tintas', 'Jefe HSE', '2026-09-25', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas' AND articulo = 'Art. 22° — Almacenamiento de solventes y tintas de impresión';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Completar ensayos de migración de tintas y adhesivos, y formalizar declaración de aptitud alimentaria de los materiales de etiquetado', 'Gerencia de Calidad', '2026-10-20', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'Reglamento Sanitario de los Alimentos (DS N°977)' AND articulo = 'Título XIV — Envases y utensilios en contacto con alimentos';

END $$;
