-- demo-data-petroquim.sql
-- Datos demo para Petroquim — reunión en planta
-- Rubro: producción y transformación de plásticos
-- INSTRUCCIONES:
--   1. En /admin → Clientes → "Crear cliente": crea demo@petroquim.cl
--      (nombre: Petroquim Demo, empresa: Petroquim). Esto crea el usuario en
--      auth.users Y la fila en normaai_clientes en un solo paso ya validado
--      por la app — no lo reemplaces por un INSERT manual.
--   2. Inicia sesión como demo@petroquim.cl y completa el onboarding guiado
--      (rubro: Producción y transformación de plásticos · normas ISO: 9001,
--      14001, 45001 · sitios: Planta Petroquim) — toma ~3 min, es el mismo
--      flujo que le vendimos en la propuesta.
--   3. Copia el UUID del usuario desde auth.users y reemplaza DEMO_USER_ID_AQUI
--      abajo. Ejecuta este script en Supabase → SQL Editor para cargar los
--      requisitos de ejemplo.
--
-- Nota: el rubro y las normas ISO están tomados de lo que Cristián confirmó
-- de memoria. Si Petroquim precisa su rubro exacto o certificaciones antes
-- de la reunión, ajustar el onboarding y este script.

DO $$
DECLARE
  v_uid UUID := 'DEMO_USER_ID_AQUI'::UUID;  -- <- REEMPLAZAR
  v_emp TEXT := 'Petroquim';
BEGIN

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 20.920 (Ley REP) — Envases y embalajes plásticos
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'Ley 20.920 — Ley REP (Responsabilidad Extendida del Productor)', 'Art. 3° — Productos prioritarios',
 'Como productor de envases y embalajes plásticos, la empresa debe inscribirse en el Registro de Productores (RETC) y reportar anualmente las cantidades puestas en el mercado.',
 'SI', 'Gerencia Ambiental', 'Inscripción vigente en el Registro de Productores REP, declaración 2025 presentada en plazo.', 10),

(v_uid, v_emp, 'CL', 'Ley 20.920 — Ley REP', 'DS N°12/2021 — Metas de recolección y valorización de envases y embalajes',
 'Cumplimiento de las metas graduales de recolección y valorización de envases plásticos establecidas por decreto, según el calendario de implementación vigente.',
 'PENDIENTE', 'Gerencia Ambiental', 'Meta 2026 en seguimiento con sistema de gestión colectivo REP; falta cierre de convenio con gestor autorizado.', 20),

(v_uid, v_emp, 'CL', 'Ley 20.920 — Ley REP', 'Art. 33° — Ecodiseño',
 'Fomento al ecodiseño de envases: reducción de material, facilidad de reciclaje y uso de contenido reciclado cuando sea técnicamente viable.',
 'NO', 'Gerencia de Producción', NULL, 30),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 19.300 / DS N°90 / RETC — Medio ambiente y emisiones
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 19.300 — Bases Generales del Medio Ambiente', 'RCA vigente',
 'La operación de la planta de transformación de plásticos debe ajustarse a las condiciones y compromisos ambientales de su Resolución de Calificación Ambiental (RCA), cuando corresponda por tamaño o proceso.',
 'SI', 'Gerencia Ambiental', 'Seguimiento de RCA con reporte semestral a la Superintendencia del Medio Ambiente.', 40),

(v_uid, v_emp, 'CL', 'DS N°138 — Declaración de Emisiones al Aire', 'Art. 1°',
 'Declaración de emisiones atmosféricas asociadas a procesos de extrusión, inyección y termoformado (compuestos orgánicos volátiles, material particulado).',
 'PENDIENTE', 'Gerencia Ambiental', 'Declaración 2025 en proceso de consolidación de datos de planta.', 50),

(v_uid, v_emp, 'CL', 'RETC — Registro de Emisiones y Transferencia de Contaminantes', 'DS N°1 (MMA)',
 'Declaración anual de residuos industriales (mermas, rechazos de proceso) y sustancias químicas utilizadas como aditivos o colorantes.',
 'SI', 'Gerencia Ambiental', 'Declaración RETC presentada en plazo, incluye residuos de proceso y aditivos plásticos.', 60),

-- ════════════════════════════════════════════════════════════
-- CHILE — DS N°43 — Sustancias peligrosas (resinas, aditivos, solventes)
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas', 'Art. 22°',
 'Almacenamiento de aditivos, colorantes y solventes usados en el proceso debe contar con hojas de datos de seguridad (HDS), señalización y compatibilidad química.',
 'SI', 'Jefe HSE', 'HDS disponibles en bodega de insumos; matriz de compatibilidad actualizada en marzo 2026.', 70),

(v_uid, v_emp, 'CL', 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas', 'Art. 46°',
 'Personal que manipula aditivos y solventes debe estar capacitado y contar con equipo de protección personal específico.',
 'NO', 'Jefe HSE', NULL, 80),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 16.744 y DS N°594 — Seguridad y salud laboral
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 67°',
 'Reglamento Interno de Higiene y Seguridad debe incluir procedimientos específicos para máquinas extrusoras, inyectoras y riesgo de quemaduras por material fundido.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado y enviado a Mutual de Seguridad, incluye anexo de riesgos de planta de plásticos.', 90),

(v_uid, v_emp, 'CL', 'DS N°594 — Condiciones Sanitarias y Ambientales en Lugares de Trabajo', 'Art. 53° y 75°',
 'Control de exposición ocupacional a humos de proceso y ruido industrial (extrusoras, molinos de reciclado) según límites permisibles.',
 'PENDIENTE', 'Jefe HSE', 'Monitoreo de higiene industrial (ruido y calidad de aire) programado para el próximo trimestre.', 100),

(v_uid, v_emp, 'CL', 'Comité Paritario de Higiene y Seguridad — Código del Trabajo', 'Art. 66°',
 'Constitución y funcionamiento de Comité Paritario en faenas con más de 25 trabajadores.',
 'SI', 'Gerencia RRHH', 'Comité constituido, actas de reuniones mensuales disponibles.', 110);

END $$;
