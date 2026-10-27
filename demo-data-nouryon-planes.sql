-- demo-data-nouryon-planes.sql
-- Planes de acción demo para Nouryon (Planta Eka Chile, Talcahuano), uno
-- por cada uno de los 4 requisitos "NO cumple". Ejecutar DESPUÉS de
-- demo-data-nouryon.sql, una sola vez (no es idempotente).
--
-- INSTRUCCIONES: usa el mismo UUID que en demo-data-nouryon.sql y
-- ejecuta en Supabase → SQL Editor.

DO $$
DECLARE
  v_uid UUID := 'DEMO_USER_ID_AQUI'::UUID;  -- <- REEMPLAZAR
BEGIN

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Consolidar mediciones de gases de celdas y presentar declaración de emisiones atmosféricas al SEIA/SMA', 'Gerencia Ambiental', '2026-11-20', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°138 — Declaración de Emisiones al Aire' AND articulo = 'Art. 1°';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Formalizar contrato con gestor autorizado para retiro y disposición de residuos peligrosos del proceso electroquímico', 'Gerencia Ambiental', '2026-12-01', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'D.S. N°148 — Reglamento Sanitario sobre Manejo de Residuos Peligrosos' AND articulo = 'Declaración y disposición de residuos peligrosos';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Actualizar certificación de instalaciones eléctricas de celdas de electrólisis conforme a normativa vigente', 'Jefe HSE', '2026-11-15', 'EN_CURSO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo' AND articulo = 'Art. 39° — Instalaciones eléctricas';

INSERT INTO normaai_planes_accion (requisito_id, user_id, accion, responsable, fecha_limite, estado)
SELECT id, v_uid, 'Certificar a transportistas y actualizar documentación de despacho de clorato de sodio según reglamento de cargas peligrosas', 'Gerencia de Operaciones', '2026-12-10', 'ABIERTO'
FROM normaai_requisitos WHERE user_id = v_uid AND cuerpo_legal = 'DS N°298 — Reglamento de Transporte de Cargas Peligrosas por Calles y Caminos' AND articulo = 'Despacho de clorato de sodio a plantas de celulosa';

END $$;
