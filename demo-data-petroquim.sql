-- demo-data-petroquim.sql
-- Datos demo para Petroquim — reunión en planta
-- INSTRUCCIONES:
--   1. En /admin → Clientes → "Crear cliente": crea demo@petroquim.cl
--      (nombre: Petroquim Demo, empresa: Petroquim). Esto crea el usuario en
--      auth.users Y la fila en normaai_clientes en un solo paso ya validado
--      por la app — no lo reemplaces por un INSERT manual.
--   2. Inicia sesión como demo@petroquim.cl y completa el onboarding guiado
--      (rubro: Producción y procesamiento petroquímico · normas ISO: 9001,
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
-- CHILE — DS N°160 — Combustibles líquidos e instalaciones petroquímicas
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'DS N°160 — Reglamento de Seguridad para Instalaciones y Operaciones de Combustibles Líquidos', 'Art. 1° y ss.',
 'Instalaciones de almacenamiento, procesamiento y manejo de combustibles líquidos deben cumplir estándares de diseño, distancias de seguridad y operación segura.',
 'SI', 'Gerencia de Planta', 'Instalaciones certificadas y con mantención preventiva vigente según cronograma anual.', 10),

(v_uid, v_emp, 'CL', 'DS N°160 — Reglamento de Seguridad para Instalaciones y Operaciones de Combustibles Líquidos', 'Art. 111°',
 'Obligación de contar con Plan de Emergencia actualizado ante derrames, incendios o fugas en instalaciones de proceso.',
 'SI', 'Jefe HSE', 'Plan de emergencia vigente, simulacro realizado en el primer semestre 2026.', 20),

(v_uid, v_emp, 'CL', 'DS N°160 — Reglamento de Seguridad para Instalaciones y Operaciones de Combustibles Líquidos', 'Art. 149°',
 'Inspección periódica de estanques de almacenamiento por organismo autorizado (integridad estructural, corrosión).',
 'PENDIENTE', 'Gerencia de Planta', 'Inspección de estanques programada, agenda pendiente de confirmar con organismo certificador.', 30),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 19.300 y DS N°90 — Medio ambiente y emisiones
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 19.300 — Bases Generales del Medio Ambiente', 'RCA vigente',
 'La operación de la planta debe ajustarse a las condiciones y compromisos ambientales de su Resolución de Calificación Ambiental (RCA).',
 'SI', 'Gerencia Ambiental', 'Seguimiento de RCA con reporte semestral a la Superintendencia del Medio Ambiente.', 40),

(v_uid, v_emp, 'CL', 'DS N°90 — Norma de Emisión para la Regulación de Contaminantes Asociados a Descargas de Residuos Líquidos', 'Art. 5°',
 'Límites máximos permitidos de contaminantes en descargas líquidas industriales, con monitoreo periódico obligatorio.',
 'SI', 'Gerencia Ambiental', 'Monitoreo trimestral con laboratorio acreditado, reportado al RETC.', 50),

(v_uid, v_emp, 'CL', 'RETC — Registro de Emisiones y Transferencia de Contaminantes', 'DS N°1 (MMA)',
 'Declaración anual de emisiones atmosféricas, residuos y transferencias de contaminantes generados por la operación.',
 'PENDIENTE', 'Gerencia Ambiental', 'Declaración año 2025 en proceso de consolidación de datos de planta.', 60),

-- ════════════════════════════════════════════════════════════
-- CHILE — DS N°43 — Sustancias peligrosas
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas', 'Art. 22°',
 'Almacenamiento de sustancias peligrosas debe contar con hojas de datos de seguridad (HDS), señalización y compatibilidad química entre sustancias.',
 'SI', 'Jefe HSE', 'HDS disponibles en sala de control y bodega; matriz de compatibilidad actualizada en marzo 2026.', 70),

(v_uid, v_emp, 'CL', 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas', 'Art. 46°',
 'Personal que manipula sustancias peligrosas debe estar capacitado y contar con equipo de protección personal específico.',
 'NO', 'Jefe HSE', NULL, 80),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 16.744 y DS N°594 — Seguridad y salud laboral
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 67°',
 'Reglamento Interno de Higiene y Seguridad debe incluir procedimientos específicos para trabajo en planta de proceso químico.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado y enviado a Mutual de Seguridad, incluye anexo de procesos petroquímicos.', 90),

(v_uid, v_emp, 'CL', 'DS N°594 — Condiciones Sanitarias y Ambientales en Lugares de Trabajo', 'Art. 53°',
 'Control de exposición ocupacional a agentes químicos según límites permisibles ponderados (LPP).',
 'PENDIENTE', 'Jefe HSE', 'Monitoreo de higiene industrial programado para el próximo trimestre.', 100),

(v_uid, v_emp, 'CL', 'Comité Paritario de Higiene y Seguridad — Código del Trabajo', 'Art. 66°',
 'Constitución y funcionamiento de Comité Paritario en faenas con más de 25 trabajadores.',
 'SI', 'Gerencia RRHH', 'Comité constituido, actas de reuniones mensuales disponibles.', 110);

END $$;
