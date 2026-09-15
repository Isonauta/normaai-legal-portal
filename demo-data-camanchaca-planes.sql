-- demo-data-camanchaca-planes.sql
-- Planes de acción demo para Camanchaca (Planta de Proceso Tomé), uno por
-- cada uno de los 4 requisitos "NO cumple", para que se vean en la vista
-- "Agenda" (septiembre-octubre 2026). Ejecutar DESPUÉS de
-- demo-data-camanchaca.sql (versión v2), una sola vez (no es idempotente:
-- si se corre dos veces, duplica los planes).
--
-- INSTRUCCIONES: usa el mismo UUID que en demo-data-camanchaca.sql y
-- ejecuta en Supabase → SQL Editor.

DO $$
DECLARE
  v_uid UUID := 'aa9e5b30-60c3-44b8-82c9-2344c7339123'::UUID;
BEGIN

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Coordinar curso de certificación de manipulación de alimentos para toda la dotación de línea de proceso', 'Gerencia RRHH', '2026-09-25', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'Código Sanitario — Autorización de manipuladores de alimentos' AND articulo = 'Certificado de manipulación de alimentos';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Consolidar registro de residuos industriales de planta (descartes, vísceras, envases) y presentar declaración RETC 2026', 'Gerencia Ambiental', '2026-10-15', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'RETC — Registro de Emisiones y Transferencia de Contaminantes' AND articulo = 'DS N°1 (MMA)';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Actualizar hojas de datos de seguridad, señalización y plan de emergencia por fuga de amoníaco en cámaras de frío', 'Jefe HSE', '2026-09-30', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas' AND articulo = 'Art. 22° — Amoníaco como refrigerante industrial';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Formalizar contrato con gestor autorizado para retiro y disposición de residuos peligrosos de planta (aceites usados, químicos de limpieza)', 'Gerencia Ambiental', '2026-10-20', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°148 — Reglamento Sanitario sobre Manejo de Residuos Peligrosos' AND articulo = 'Declaración y disposición de residuos peligrosos';

END $$;
