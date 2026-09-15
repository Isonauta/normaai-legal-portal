-- demo-data-camanchaca.sql
-- Datos demo para Camanchaca — Planta de Proceso Tomé
-- Transformación de salmónidos: desde la materia prima al producto final
--
-- v2: corregido según revisión de Nilsson (Camanchaca) sobre el primer
-- borrador. El foco NO es pesca extractiva + acuicultura + planta
-- genérica: es específicamente la planta de transformación/proceso de
-- salmónidos en Tomé. Se sacaron los requisitos de concesiones de
-- acuicultura, cuotas/vedas, sanidad de centros de cultivo (DS 319,
-- PSEVC, RAMA/DS 320) y trabajo a bordo de naves (DIRECTEMAR) — todo eso
-- es de la fase de cultivo/captura o de la flota, no de la planta.
--
-- INSTRUCCIONES:
--   1. El usuario demo@camanchaca.cl ya existe (creado vía /admin) y ya
--      completó el onboarding. Este script:
--        a) Corrige el rubro y los sitios de trabajo en normaai_clientes
--           para que el agente Norma AI hable del negocio real.
--        b) Borra los 15 requisitos ya cargados (versión anterior, mal
--           enfocada) y carga los 15 nuevos, correctos.
--   2. Ejecuta este script completo en Supabase → SQL Editor.
--
-- Perfil corregido (para referencia / si se debe re-hacer el onboarding):
--   · Rubro: Transformación de salmónidos, desde la materia prima al
--     producto final
--   · Normas ISO: 9001, 14001, 45001
--   · Sitios de trabajo: Planta de Proceso Tomé

DO $$
DECLARE
  v_uid UUID := 'aa9e5b30-60c3-44b8-82c9-2344c7339123'::UUID;
  v_emp TEXT := 'Camanchaca';
BEGIN

-- Corregir perfil (rubro / sitios) usado como contexto del agente Norma AI
UPDATE normaai_clientes
SET rubro  = 'Transformación de salmónidos, desde la materia prima al producto final',
    sitios = 'Planta de Proceso Tomé'
WHERE user_id = v_uid;

-- Limpiar los requisitos cargados en la versión anterior (mal enfocada)
DELETE FROM normaai_requisitos WHERE user_id = v_uid;

-- ════════════════════════════════════════════════════════════
-- CHILE — Inocuidad alimentaria y exportación — RSA, SERNAPESCA
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'Reglamento Sanitario de los Alimentos (DS N°977)', 'Título V — Higiene en establecimientos de alimentos',
 'La planta de proceso de Tomé debe mantener condiciones higiénico-sanitarias y programas de limpieza y desinfección validados en toda la línea de transformación.',
 'SI', 'Gerencia de Calidad', 'Plan HACCP vigente, auditado internamente sin no conformidades mayores.', 10),

(v_uid, v_emp, 'CL', 'Certificación sanitaria de plantas exportadoras — SERNAPESCA', 'Habilitación para mercados de exportación (UE, EE.UU., Asia)',
 'Mantener la habilitación sanitaria vigente de la Planta de Proceso Tomé para exportar a cada mercado de destino, según los requisitos específicos de cada autoridad sanitaria.',
 'SI', 'Gerencia de Calidad', 'Planta habilitada y auditada por SERNAPESCA para UE y EE.UU.; próxima auditoría de renovación agendada.', 20),

(v_uid, v_emp, 'CL', 'Reglamento de Trazabilidad de Productos Pesqueros y Acuícolas — SERNAPESCA', 'Res. Ex. sobre trazabilidad',
 'Trazabilidad completa desde el ingreso de la materia prima (salmón entero) hasta el producto final elaborado y despachado, con registro por lote.',
 'PENDIENTE', 'Gerencia de Calidad', 'Trazabilidad de lote implementada en la línea principal; falta integrar la línea de valor agregado al mismo sistema.', 30),

(v_uid, v_emp, 'CL', 'Norma técnica de rotulación de productos del mar para exportación — SERNAPESCA/ISP', 'Etiquetado y rotulación nutricional',
 'El rotulado de los productos procesados debe cumplir los requisitos de etiquetado y trazabilidad exigidos por cada mercado de exportación.',
 'SI', 'Gerencia de Calidad', 'Rotulado validado por mercado de destino, sin observaciones en última auditoría.', 40),

(v_uid, v_emp, 'CL', 'Código Sanitario — Autorización de manipuladores de alimentos', 'Certificado de manipulación de alimentos',
 'El personal que participa directamente en el procesamiento de salmónidos debe contar con certificado vigente de manipulación de alimentos.',
 'NO', 'Gerencia RRHH', NULL, 50),

-- ════════════════════════════════════════════════════════════
-- CHILE — Medio ambiente de planta — Ley 19.300, DS N°90, RETC, Ley REP
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 19.300 — Bases Generales del Medio Ambiente', 'RCA vigente de la Planta de Proceso Tomé',
 'La operación de la planta debe ajustarse a las condiciones y compromisos ambientales de su Resolución de Calificación Ambiental.',
 'SI', 'Gerencia Ambiental', 'Seguimiento de RCA con reporte semestral a la Superintendencia del Medio Ambiente.', 60),

(v_uid, v_emp, 'CL', 'DS N°90 — Norma de Emisión para Descarga de Residuos Líquidos', 'Descargas de la planta de proceso',
 'Los efluentes de la planta de proceso y congelado deben cumplir los límites máximos permitidos antes de su descarga a cuerpos receptores o alcantarillado.',
 'SI', 'Gerencia Ambiental', 'Monitoreo trimestral de RILes dentro de norma, reportado a la SMA.', 70),

(v_uid, v_emp, 'CL', 'RETC — Registro de Emisiones y Transferencia de Contaminantes', 'DS N°1 (MMA)',
 'Declaración anual de residuos industriales (descartes de proceso, vísceras, envases) generados en la planta de Tomé.',
 'NO', 'Gerencia Ambiental', NULL, 80),

(v_uid, v_emp, 'CL', 'Ley 20.920 — Ley REP (Responsabilidad Extendida del Productor)', 'Envases y embalajes de despacho',
 'Como generador de envases y embalajes (cajas de cartón, film plástico) para el despacho de producto terminado, la planta debe reportar las cantidades puestas en el mercado.',
 'PENDIENTE', 'Gerencia Ambiental', 'Inscripción en Registro de Productores REP en trámite.', 90),

-- ════════════════════════════════════════════════════════════
-- CHILE — Seguridad y salud laboral de planta — Ley 16.744, DS N°594, DS N°43
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 67° — Reglamento Interno de Higiene y Seguridad',
 'El RIOHS debe incluir procedimientos específicos para líneas de fileteado, cámaras de frío y manejo de maquinaria de proceso.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado y enviado a mutualidad, con anexos específicos para planta de proceso.', 100),

(v_uid, v_emp, 'CL', 'Comité Paritario de Higiene y Seguridad — Código del Trabajo', 'Art. 66°',
 'Constitución y funcionamiento de Comité Paritario en la Planta de Proceso Tomé, con más de 25 trabajadores.',
 'SI', 'Gerencia RRHH', 'Comité constituido, actas de reuniones mensuales disponibles.', 110),

(v_uid, v_emp, 'CL', 'DS N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 53° — Exposición ocupacional al frío y ruido',
 'Control de exposición ocupacional al frío, ruido y superficies húmedas en líneas de proceso y cámaras de congelado.',
 'PENDIENTE', 'Jefe HSE', 'Monitoreo de higiene industrial programado para el próximo trimestre en línea de congelado.', 120),

(v_uid, v_emp, 'CL', 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas', 'Art. 22° — Amoníaco como refrigerante industrial',
 'El sistema de refrigeración industrial con amoníaco de las cámaras de frío debe contar con hojas de datos de seguridad, señalización y plan de emergencia frente a fugas.',
 'NO', 'Jefe HSE', NULL, 130),

(v_uid, v_emp, 'CL', 'DS N°148 — Reglamento Sanitario sobre Manejo de Residuos Peligrosos', 'Declaración y disposición de residuos peligrosos',
 'Los residuos peligrosos de planta (aceites usados, químicos de limpieza, envases contaminados) deben declararse y disponerse a través de un gestor autorizado.',
 'NO', 'Gerencia Ambiental', NULL, 140),

(v_uid, v_emp, 'CL', 'Resolución Sanitaria — Autorización de Funcionamiento', 'Código Sanitario, Libro I',
 'La Planta de Proceso Tomé debe mantener vigente su Resolución Sanitaria de autorización de funcionamiento ante la autoridad sanitaria regional.',
 'SI', 'Gerencia de Calidad', 'Resolución Sanitaria vigente, renovada sin observaciones en la última inspección.', 150);

END $$;
