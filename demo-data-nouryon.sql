-- demo-data-nouryon.sql
-- Datos demo para Nouryon — Planta Eka Chile, Talcahuano (Región del Biobío)
-- Producción de clorato de sodio y soluciones de blanqueo de pulpa de
-- celulosa para la industria forestal (marca Eka de Nouryon).
--
-- Fuente de los datos del sitio: página oficial de ubicaciones de Nouryon
-- (nouryon.com/company/locations/Talcahuano) — no se pudo acceder
-- directamente desde este entorno (dominio bloqueado), pero se confirmó
-- vía búsqueda: nombre del sitio "Eka Chile", dirección Av. Rocoto 2911,
-- Talcahuano, teléfono +56 41 2129200, clasificado como "Plant". El
-- rubro (clorato de sodio / química de blanqueo de pulpa) se infiere del
-- comunicado de Nouryon de 2023 sobre la puesta en marcha de su planta
-- de dióxido de cloro para el proyecto MAPA de Arauco en la Región del
-- Biobío y de la expansión de capacidad de clorato de sodio en
-- Sudamérica reportada por Nouryon.
--
-- INSTRUCCIONES:
--   1. En /admin → Clientes → "Crear cliente": crea demo@nouryon.cl
--      (nombre: Nouryon Demo, empresa: Nouryon, clave: Nouryon).
--   2. Inicia sesión como demo@nouryon.cl y completa el onboarding, o
--      deja que el paso 3 de este script fije el perfil igual:
--        · Rubro: Producción de clorato de sodio y soluciones de
--          blanqueo de pulpa de celulosa para la industria forestal
--          (marca Eka de Nouryon)
--        · Normas ISO: Sustentabilidad y Prevención de Riesgos, más
--          ISO 50001 (Gestión de la Energía) — no se habla de los
--          sistemas por su número (9001/14001/45001) sino por el área
--          que cubren, a pedido del cliente.
--        · Sitios de trabajo: Planta Eka Chile — Av. Rocoto 2911,
--          Talcahuano, Región del Biobío
--   3. Copia el UUID del usuario desde auth.users y reemplaza
--      DEMO_USER_ID_AQUI abajo. Ejecuta este script en Supabase → SQL
--      Editor.

DO $$
DECLARE
  v_uid UUID := 'c4bcd359-b6be-433f-9e45-ba3ebf1027cd'::UUID;
  v_emp TEXT := 'Nouryon';
BEGIN

UPDATE normaai_clientes
SET rubro  = 'Producción de clorato de sodio y soluciones de blanqueo de pulpa de celulosa para la industria forestal (marca Eka de Nouryon)',
    normas_iso = 'Sustentabilidad y Prevención de Riesgos, ISO 50001 (Gestión de la Energía)',
    sitios = 'Planta Eka Chile — Av. Rocoto 2911, Talcahuano, Región del Biobío',
    onboarding_completado = true
WHERE user_id = v_uid;

-- ════════════════════════════════════════════════════════════
-- MEDIO AMBIENTE — Ley 19.300, DS N°90, DS N°138, RETC
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'Ley 19.300 — Bases Generales del Medio Ambiente', 'RCA vigente de la planta',
 'La operación de la planta electroquímica de Talcahuano debe ajustarse a las condiciones y compromisos ambientales de su Resolución de Calificación Ambiental.',
 'SI', 'Gerencia Ambiental', 'Seguimiento de RCA con reporte semestral a la Superintendencia del Medio Ambiente.', 10),

(v_uid, v_emp, 'CL', 'DS N°90 — Norma de Emisión para Descarga de Residuos Líquidos', 'Descargas del proceso electroquímico',
 'Los efluentes del proceso de producción de clorato de sodio deben cumplir los límites máximos permitidos antes de su descarga a cuerpos receptores.',
 'SI', 'Gerencia Ambiental', 'Monitoreo trimestral de RILes dentro de norma, reportado a la SMA.', 20),

(v_uid, v_emp, 'CL', 'DS N°138 — Declaración de Emisiones al Aire', 'Art. 1°',
 'Declaración de emisiones atmosféricas asociadas al proceso electroquímico (gases de celdas, manejo de cloro e hidrógeno).',
 'NO', 'Gerencia Ambiental', NULL, 30),

(v_uid, v_emp, 'CL', 'RETC — Registro de Emisiones y Transferencia de Contaminantes', 'DS N°1 (MMA)',
 'Declaración anual de residuos industriales y sustancias químicas utilizadas en el proceso de producción de clorato de sodio.',
 'SI', 'Gerencia Ambiental', 'Declaración RETC presentada en plazo.', 40),

-- ════════════════════════════════════════════════════════════
-- SUSTANCIAS Y RESIDUOS PELIGROSOS — DS N°43, DS N°148
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas', 'Art. 22°',
 'Almacenamiento de materias primas y productos del proceso electroquímico (cloruro de sodio, ácido clorhídrico, hidróxido de sodio, clorato de sodio) con hojas de datos de seguridad, señalización y compatibilidad química.',
 'SI', 'Jefe HSE', 'HDS disponibles en bodega de insumos, matriz de compatibilidad actualizada.', 50),

(v_uid, v_emp, 'CL', 'D.S. N°148 — Reglamento Sanitario sobre Manejo de Residuos Peligrosos', 'Declaración y disposición de residuos peligrosos',
 'Los residuos peligrosos del proceso electroquímico deben declararse y disponerse a través de un gestor autorizado por la Autoridad Sanitaria.',
 'NO', 'Gerencia Ambiental', NULL, 60),

(v_uid, v_emp, 'CL', 'NCh 382 — Clasificación y Etiquetado de Sustancias Peligrosas', 'Rotulado de clorato de sodio como agente oxidante',
 'El clorato de sodio y otras sustancias oxidantes producidas o almacenadas en planta deben rotularse según la clasificación de riesgo NCh 382.',
 'SI', 'Jefe HSE', 'Rotulado de envases y estanques verificado en última auditoría interna.', 70),

-- ════════════════════════════════════════════════════════════
-- SEGURIDAD Y SALUD OCUPACIONAL — Ley 16.744, DS N°594, DS N°44
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 67° — Reglamento Interno de Higiene y Seguridad',
 'El RIOHS debe incluir procedimientos específicos para el proceso electroquímico, manejo de celdas de electrólisis y sustancias oxidantes.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado y registrado ante la Inspección del Trabajo.', 80),

(v_uid, v_emp, 'CL', 'DS N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 53° — Elementos de Protección Personal',
 'El personal que opera el proceso electroquímico y manipula sustancias oxidantes debe contar con EPP específico, provisto sin costo y mantenido en buen estado.',
 'SI', 'Jefe HSE', 'Verificación documental y en terreno de entrega y uso de EPP.', 90),

(v_uid, v_emp, 'CL', 'D.S. N°44 — Reglamento sobre Gestión Preventiva de Riesgos Laborales', 'Art. 50° — Comité Paritario y Depto. de Prevención de Riesgos',
 'Constitución y funcionamiento del Comité Paritario de Higiene y Seguridad y del Departamento de Prevención de Riesgos según dotación de la planta.',
 'SI', 'Jefe HSE', 'Comité Paritario constituido y Depto. de Prevención de Riesgos operativo, actas al día.', 100),

(v_uid, v_emp, 'CL', 'DS N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 39° — Instalaciones eléctricas',
 'Las instalaciones eléctricas asociadas a las celdas de electrólisis deben ser construidas, instaladas, protegidas y mantenidas conforme a la normativa vigente.',
 'NO', 'Jefe HSE', NULL, 110),

-- ════════════════════════════════════════════════════════════
-- TRANSPORTE Y DESPACHO — DS N°298, DIRECTEMAR, Código Sanitario
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DS N°298 — Reglamento de Transporte de Cargas Peligrosas por Calles y Caminos', 'Despacho de clorato de sodio a plantas de celulosa',
 'El transporte terrestre de clorato de sodio (agente oxidante Clase 5.1) hacia las plantas de celulosa clientes debe cumplir la reglamentación de transporte de cargas peligrosas.',
 'NO', 'Gerencia de Operaciones', NULL, 120),

(v_uid, v_emp, 'CL', 'DIRECTEMAR — Reglamento para el Control de Contaminación Acuática y manejo de mercancías peligrosas', 'Despacho portuario de sustancias oxidantes',
 'El despacho o recepción de insumos y productos peligrosos a través del puerto de Talcahuano debe ajustarse a la normativa de mercancías peligrosas de DIRECTEMAR.',
 'PENDIENTE', 'Gerencia de Operaciones', 'Procedimiento de despacho portuario en revisión conjunta con agencia de aduana.', 130),

(v_uid, v_emp, 'CL', 'Código Sanitario', 'Resolución Sanitaria de funcionamiento del establecimiento industrial',
 'La planta debe mantener vigente su Resolución Sanitaria de autorización de funcionamiento ante la autoridad sanitaria regional.',
 'SI', 'Gerencia de Calidad', 'Resolución Sanitaria vigente, sin observaciones en última inspección.', 140),

(v_uid, v_emp, 'CL', 'Ley 20.920 — Ley REP (Responsabilidad Extendida del Productor)', 'Envases y embalajes industriales',
 'Como generador de envases industriales (tambores, IBC, estanques retornables) para el despacho de clorato de sodio, la planta debe evaluar su inscripción en el Registro de Productores REP.',
 'PENDIENTE', 'Gerencia Ambiental', 'Evaluación de aplicabilidad en curso con asesoría externa.', 150),

-- ════════════════════════════════════════════════════════════
-- GESTIÓN DE LA ENERGÍA — Ley 21.305 (Eficiencia Energética)
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley N°21.305 — Eficiencia Energética', 'Art. 6° — Sistema de Gestión de la Energía para Grandes Consumidores',
 'El proceso electroquímico de producción de clorato de sodio es intensivo en energía; si la planta califica como Gran Consumidor de Energía, debe reportar su consumo a la Agencia de Sostenibilidad Energética e implementar un sistema de gestión de la energía.',
 'PENDIENTE', 'Gerencia de Operaciones', 'Evaluación de umbral de Gran Consumidor en curso; levantamiento de línea base energética iniciado.', 160);

END $$;
