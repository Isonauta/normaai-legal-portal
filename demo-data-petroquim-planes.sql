-- demo-data-petroquim-planes.sql
-- Planes de acción demo para Petroquim, para que se vean en la vista "Agenda"
-- (septiembre-octubre 2026). Ejecutar DESPUÉS de demo-data-petroquim.sql,
-- una sola vez (no es idempotente: si se corre dos veces, duplica los planes).
--
-- INSTRUCCIONES: reemplaza DEMO_USER_ID_AQUI por el mismo UUID que usaste
-- en demo-data-petroquim.sql y ejecuta en Supabase → SQL Editor.

DO $$
DECLARE
  v_uid UUID := 'DEMO_USER_ID_AQUI'::UUID;  -- <- REEMPLAZAR
BEGIN

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Cerrar convenio con gestor autorizado REP y definir plan de recolección 2026', 'Gerencia Ambiental', '2026-09-15', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'Ley 20.920 — Ley REP' AND articulo = 'DS N°12/2021 — Metas de recolección y valorización de envases y embalajes';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Consolidar datos de planta y presentar declaración de emisiones 2025', 'Gerencia Ambiental', '2026-09-05', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°138 — Declaración de Emisiones al Aire' AND articulo = 'Art. 1°';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Programar capacitación de manejo de sustancias peligrosas para operadores de línea', 'Jefe HSE', '2026-09-20', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas' AND articulo = 'Art. 46°';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Contratar monitoreo de ruido y calidad de aire en planta', 'Jefe HSE', '2026-10-10', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°594 — Condiciones Sanitarias y Ambientales en Lugares de Trabajo' AND articulo = 'Art. 53° y 75°';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Evaluar rediseño de envases para reducir gramaje y facilitar reciclaje', 'Gerencia de Producción', '2026-10-30', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'Ley 20.920 — Ley REP' AND articulo = 'Art. 33° — Ecodiseño';

END $$;
