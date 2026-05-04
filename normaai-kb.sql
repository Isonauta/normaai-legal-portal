-- ============================================================
--  NORMAAI — Base de Conocimiento Legal (KB)
--  Normativa chilena más común por norma ISO
--  Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS normaai_kb (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  norma_iso   TEXT NOT NULL,
  cuerpo_legal TEXT NOT NULL,
  numero      TEXT,
  tipo        TEXT,
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  articulos_clave TEXT,
  como_cumplir TEXT,
  evidencia_minima TEXT,
  url_bcn     TEXT,
  vigente     BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE normaai_kb DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_kb_norma ON normaai_kb(norma_iso);

-- ============================================================
--  ISO 14001 — GESTIÓN AMBIENTAL
-- ============================================================
INSERT INTO normaai_kb (norma_iso, cuerpo_legal, numero, tipo, titulo, descripcion, articulos_clave, como_cumplir, evidencia_minima, url_bcn) VALUES

('ISO 14001', 'Ley 19.300', '19.300', 'Ley', 'Ley sobre Bases Generales del Medio Ambiente',
'Marco general de protección ambiental en Chile. Base de todo el sistema de gestión ambiental.',
'Art. 2 (definiciones), Art. 10 (actividades que requieren EIA/DIA), Art. 64 (normas de emisión)',
'Identificar si la actividad requiere Resolución de Calificación Ambiental (RCA). Si tiene RCA, cumplir todas las condiciones establecidas.',
'RCA vigente (si aplica), registro de monitoreos, informes de cumplimiento de condiciones RCA',
'https://www.bcn.cl/leychile/navegar?idNorma=30667'),

('ISO 14001', 'DS 148/2003', '148', 'Decreto Supremo', 'Reglamento Sanitario sobre Manejo de Residuos Peligrosos',
'Regula la generación, transporte, almacenamiento, tratamiento y disposición final de residuos peligrosos.',
'Art. 17-20 (almacenamiento), Art. 21-24 (transporte), Art. 25-28 (tratamiento), Art. 29-32 (obligaciones del generador)',
'Identificar si genera residuos peligrosos. Si genera, registrarse en RETC, contratar empresa autorizada para disposición, mantener registros.',
'Registro RETC, contratos con empresas autorizadas, manifiestos de residuos peligrosos, registros de generación mensual',
'https://www.bcn.cl/leychile/navegar?idNorma=167430'),

('ISO 14001', 'Ley 20.920', '20.920', 'Ley', 'Ley REP - Responsabilidad Extendida del Productor',
'Establece obligaciones para productores, importadores y distribuidores de productos prioritarios (aceites, neumáticos, baterías, envases, RAEE, textiles).',
'Art. 5 (productos prioritarios), Art. 9 (obligaciones de productores), Art. 26 (metas de recolección)',
'Determinar si la empresa es productor/importador de productos prioritarios. Si aplica, adherirse a un sistema de gestión autorizado.',
'Contrato con sistema de gestión autorizado, declaraciones anuales, registros de productos puestos en el mercado',
'https://www.bcn.cl/leychile/navegar?idNorma=1090894'),

('ISO 14001', 'DS 1/2013 MMA', '1', 'Decreto Supremo', 'Reglamento del SINADER - Residuos No Peligrosos',
'Regula el sistema nacional de declaración de residuos.',
'Art. 17 (obligaciones de declaración), Art. 18 (plazos)',
'Realizar declaración anual de residuos no peligrosos en plataforma RETC antes del 31 de marzo de cada año.',
'Declaración RETC anual, registros mensuales de generación de residuos, contratos con gestores',
'https://www.bcn.cl/leychile/navegar?idNorma=1051158'),

('ISO 14001', 'DS 90/2000', '90', 'Decreto Supremo', 'Norma de Emisión para Regulación de Contaminantes en Aguas',
'Establece límites máximos de contaminantes en descargas de Residuos Líquidos (RILES) a aguas superficiales y marinas.',
'Art. 5-8 (límites máximos permisibles), Art. 13 (monitoreo y autocontrol)',
'Si la empresa genera RILES, obtener autorización de descarga, realizar automonitoreo periódico y declarar en RETC.',
'Autorización de descarga, informes de automonitoreo, declaración RETC RILES',
'https://www.bcn.cl/leychile/navegar?idNorma=167860'),

('ISO 14001', 'DS 59/1998', '59', 'Decreto Supremo', 'Norma de Emisión para Ruido',
'Establece niveles máximos permisibles de ruido para fuentes fijas.',
'Art. 5 (niveles máximos según zona y horario)',
'Realizar medición de ruido en perímetro de instalaciones. Si supera límites, implementar medidas de mitigación.',
'Informe de medición de ruido acústico, medidas de mitigación implementadas',
'https://www.bcn.cl/leychile/navegar?idNorma=148997'),

('ISO 14001', 'DS 138/2005', '138', 'Decreto Supremo', 'Establece obligación de declarar emisiones al aire (RETC)',
'Obliga a fuentes industriales a declarar anualmente sus emisiones al aire.',
'Art. 3 (obligados a declarar), Art. 5 (plazos: 31 de marzo)',
'Determinar si la empresa está obligada a declarar. Si aplica, completar declaración en RETC antes del 31 de marzo.',
'Declaración RETC emisiones al aire, registros de consumo de combustibles, registros de procesos',
'https://www.bcn.cl/leychile/navegar?idNorma=238971'),

-- ============================================================
--  ISO 45001 — SEGURIDAD Y SALUD EN EL TRABAJO
-- ============================================================
('ISO 45001', 'Ley 16.744', '16.744', 'Ley', 'Ley de Accidentes del Trabajo y Enfermedades Profesionales',
'Marco fundamental de la seguridad laboral en Chile. Establece el seguro de accidentes del trabajo.',
'Art. 3 (accidente del trabajo), Art. 7 (enfermedad profesional), Art. 66 bis (sistema de gestión SST para empresas +50 trabajadores)',
'Afiliar a todos los trabajadores a la mutual. Tener Reglamento Interno de Orden, Higiene y Seguridad. Constituir Comité Paritario si tiene +25 trabajadores.',
'Nómina de afiliados a mutual, Reglamento Interno vigente, actas Comité Paritario, registros de accidentes (DIAT)',
'https://www.bcn.cl/leychile/navegar?idNorma=28650'),

('ISO 45001', 'DS 40/1969', '40', 'Decreto Supremo', 'Reglamento sobre Prevención de Riesgos Profesionales',
'Establece obligaciones de prevención de riesgos para empleadores.',
'Art. 21 (Reglamento Interno obligatorio), Art. 22 (contenido mínimo del Reglamento), Art. 68 (elementos de protección personal)',
'Elaborar y actualizar Reglamento Interno de Orden, Higiene y Seguridad. Entregar copia a cada trabajador con constancia de recepción.',
'Reglamento Interno actualizado, constancias de entrega a trabajadores, registro de capacitaciones',
'https://www.bcn.cl/leychile/navegar?idNorma=28701'),

('ISO 45001', 'DS 54/1969', '54', 'Decreto Supremo', 'Reglamento para la Constitución y Funcionamiento de los Comités Paritarios',
'Regula la constitución y funcionamiento de los Comités Paritarios de Higiene y Seguridad.',
'Art. 1 (obligación +25 trabajadores), Art. 10 (reuniones mensuales), Art. 24 (funciones del Comité)',
'Constituir Comité Paritario si tiene 25 o más trabajadores. Realizar reuniones mensuales y registrar en actas.',
'Acta de constitución, actas de reuniones mensuales, registros de inspecciones y recomendaciones',
'https://www.bcn.cl/leychile/navegar?idNorma=28710'),

('ISO 45001', 'DS 594/1999', '594', 'Decreto Supremo', 'Reglamento sobre Condiciones Sanitarias y Ambientales Básicas en los Lugares de Trabajo',
'Establece condiciones mínimas de higiene y seguridad en lugares de trabajo.',
'Art. 3 (condiciones generales), Art. 32-43 (agentes físicos: ruido, vibración, temperatura), Art. 44-57 (agentes químicos)',
'Evaluar condiciones del ambiente de trabajo. Implementar medidas de control según jerarquía: eliminación, sustitución, control de ingeniería, EPP.',
'Evaluaciones ambientales (ruido, temperatura, químicos), registros de mediciones, programa de vigilancia',
'https://www.bcn.cl/leychile/navegar?idNorma=167766'),

('ISO 45001', 'Ley 21.643', '21.643', 'Ley', 'Ley Karin - Prevención y Sanción del Acoso Laboral y Sexual',
'Refuerza la prohibición del acoso laboral y sexual. Obliga a empresas a tener protocolo de prevención.',
'Art. 2 (definición acoso laboral y sexual), Art. 3 (obligación de protocolo), Art. 4 (investigación interna)',
'Elaborar y publicar Protocolo de Prevención de Acoso. Designar persona responsable de recibir denuncias. Capacitar a toda la dotación.',
'Protocolo de prevención publicado, constancias de capacitación, registro de denuncias y resoluciones',
'https://www.bcn.cl/leychile/navegar?idNorma=1197743'),

('ISO 45001', 'DS 57/2021', '57', 'Decreto Supremo', 'Reglamento del Seguro de Salud y Accidentes del Trabajo',
'Actualiza y complementa la Ley 16.744 en materia de prestaciones y procedimientos.',
'Art. 5 (declaración de accidentes DIAT), Art. 12 (investigación de accidentes), Art. 18 (enfermedades profesionales DIEP)',
'Declarar todo accidente del trabajo mediante DIAT dentro de 24 horas. Investigar causas de accidentes graves o fatales.',
'DIAT de todos los accidentes, informes de investigación, DIEP de enfermedades profesionales',
'https://www.bcn.cl/leychile/navegar?idNorma=1163441'),

('ISO 45001', 'Ley 20.001', '20.001', 'Ley', 'Regula el peso máximo de carga humana',
'Establece límites de peso para levantamiento y transporte manual de cargas.',
'Art. 211-H CT (peso máximo 25 kg hombres, 20 kg mujeres, 15 kg menores)',
'Evaluar tareas de manejo manual de cargas. Implementar ayudas mecánicas o limitar pesos. Capacitar en técnicas de levantamiento.',
'Evaluación de riesgos ergonómicos, registros de capacitación, evidencia de ayudas mecánicas',
'https://www.bcn.cl/leychile/navegar?idNorma=230882'),

('ISO 45001', 'DS 76/2006', '76', 'Decreto Supremo', 'Reglamento para la Aplicación del Artículo 66 bis de la Ley 16.744 (Empresas Contratistas)',
'Regula las obligaciones de empresas principales respecto a la seguridad de trabajadores de contratistas.',
'Art. 3 (obligaciones empresa principal), Art. 7 (registro de contratistas), Art. 11 (comité paritario de faena)',
'Implementar sistema de gestión de contratistas. Exigir antecedentes de seguridad. Constituir Comité de Faena si aplica.',
'Registro de contratistas, antecedentes de seguridad de contratistas, actas Comité de Faena',
'https://www.bcn.cl/leychile/navegar?idNorma=251127'),

-- ============================================================
--  ISO 27001 — SEGURIDAD DE LA INFORMACIÓN
-- ============================================================
('ISO 27001', 'Ley 21.719', '21.719', 'Ley', 'Ley de Protección de Datos Personales',
'Nueva ley chilena de protección de datos personales. Crea la Agencia de Protección de Datos Personales.',
'Art. 3 (principios), Art. 14 (derecho de acceso), Art. 15 (rectificación), Art. 16 (cancelación), Art. 17 (oposición), Art. 18 (portabilidad), Art. 26 (registro de tratamiento)',
'Elaborar registro de actividades de tratamiento. Designar Delegado de Protección de Datos si aplica. Implementar medidas de seguridad técnicas y organizativas.',
'Registro de tratamiento de datos, política de privacidad, procedimiento de atención de derechos ARCO, evidencia de medidas de seguridad',
'https://www.bcn.cl/leychile/navegar?idNorma=1211923'),

('ISO 27001', 'Ley 19.628', '19.628', 'Ley', 'Ley sobre Protección de la Vida Privada (vigente hasta entrada en vigor de Ley 21.719)',
'Marco actual de protección de datos personales hasta que entre en vigencia la Ley 21.719.',
'Art. 4 (consentimiento), Art. 10 (datos sensibles), Art. 12 (derechos del titular)',
'Obtener consentimiento para tratamiento de datos. Proteger especialmente datos sensibles. Permitir acceso y rectificación a titulares.',
'Formularios de consentimiento, políticas de privacidad, procedimientos de ejercicio de derechos',
'https://www.bcn.cl/leychile/navegar?idNorma=141599'),

('ISO 27001', 'Ley 19.223', '19.223', 'Ley', 'Ley de Delitos Informáticos (complementada por Ley 21.459)',
'Tipifica delitos informáticos en Chile.',
'Art. 1 (sabotaje informático), Art. 2 (espionaje informático), Art. 3 (interceptación), Art. 4 (falsificación)',
'Implementar controles para prevenir acceso no autorizado a sistemas. Establecer procedimiento de respuesta a incidentes.',
'Políticas de seguridad, controles de acceso, registros de incidentes de seguridad',
'https://www.bcn.cl/leychile/navegar?idNorma=25564'),

('ISO 27001', 'Ley 21.459', '21.459', 'Ley', 'Nueva Ley de Delitos Informáticos',
'Moderniza los delitos informáticos en Chile, alineándose al Convenio de Budapest.',
'Art. 1 (acceso ilícito), Art. 2 (interceptación ilícita), Art. 4 (daño informático), Art. 6 (fraude informático)',
'Implementar controles técnicos: firewall, antivirus, cifrado, control de accesos. Capacitar al personal sobre ciberseguridad.',
'Inventario de activos de información, políticas de seguridad, registros de auditoría de sistemas',
'https://www.bcn.cl/leychile/navegar?idNorma=1181434'),

-- ============================================================
--  ISO 37001 — ANTISOBORNO
-- ============================================================
('ISO 37001', 'Ley 20.393', '20.393', 'Ley', 'Responsabilidad Penal de las Personas Jurídicas',
'Establece responsabilidad penal de empresas por delitos de cohecho, lavado de activos y financiamiento del terrorismo.',
'Art. 3 (delitos: cohecho, lavado, financiamiento terrorismo), Art. 4 (modelo de prevención), Art. 5 (encargado de prevención)',
'Implementar Modelo de Prevención de Delitos (MPD). Designar Encargado de Prevención. Capacitar a toda la organización.',
'Modelo de Prevención de Delitos aprobado por directorio, designación de Encargado, registros de capacitación, evaluación de riesgos de corrupción',
'https://www.bcn.cl/leychile/navegar?idNorma=1008668'),

('ISO 37001', 'Ley 21.595', '21.595', 'Ley', 'Ley de Delitos Económicos',
'Amplía los delitos económicos y refuerza la responsabilidad de personas jurídicas.',
'Art. 1-15 (nuevos delitos económicos), Art. 16 (responsabilidad empresarial)',
'Revisar y actualizar Modelo de Prevención de Delitos para incluir nuevos delitos económicos. Actualizar políticas de compliance.',
'Modelo de Prevención actualizado, políticas anticorrupción, canal de denuncias operativo',
'https://www.bcn.cl/leychile/navegar?idNorma=1196436'),

('ISO 37001', 'Ley 20.730', '20.730', 'Ley', 'Ley del Lobby',
'Regula el lobby y las gestiones que representen intereses particulares ante autoridades.',
'Art. 4 (sujetos pasivos), Art. 5 (obligaciones de transparencia), Art. 8 (registros públicos)',
'Si la empresa realiza gestiones ante autoridades, registrarse en plataforma de lobby. Mantener registro de reuniones con autoridades.',
'Registro en plataforma de lobby, declaraciones de reuniones con autoridades públicas',
'https://www.bcn.cl/leychile/navegar?idNorma=1060756'),

-- ============================================================
--  ISO 22000 / INOCUIDAD ALIMENTARIA
-- ============================================================
('ISO 22000', 'DS 977/1996', '977', 'Decreto Supremo', 'Reglamento Sanitario de los Alimentos',
'Marco regulatorio principal para la producción, elaboración y comercialización de alimentos en Chile.',
'Art. 6-9 (principios generales de higiene), Art. 54-69 (aditivos), Art. 107-130 (etiquetado)',
'Cumplir buenas prácticas de manufactura (BPM). Implementar HACCP si corresponde. Obtener resolución sanitaria.',
'Resolución sanitaria vigente, manual BPM, plan HACCP, registros de control de calidad',
'https://www.bcn.cl/leychile/navegar?idNorma=167001'),

('ISO 22000', 'Ley 20.606', '20.606', 'Ley', 'Ley sobre Composición Nutricional de los Alimentos y su Publicidad',
'Ley de etiquetado nutricional con sellos de advertencia (Ley de los Alimentos).',
'Art. 1 (etiquetado obligatorio), Art. 2 (sellos de advertencia), Art. 5 (restricciones de publicidad)',
'Verificar que productos alimenticios tengan etiquetado correcto con sellos si corresponde. Revisar publicidad dirigida a menores.',
'Etiquetado de productos validado, registros de composición nutricional, políticas de publicidad',
'https://www.bcn.cl/leychile/navegar?idNorma=1041570'),

('ISO 22000', 'DS 3/2014', '3', 'Decreto Supremo', 'Reglamento del Sistema de Inocuidad y Calidad Alimentaria',
'Establece requisitos de inocuidad para establecimientos de alimentos.',
'Art. 5 (registro de establecimiento), Art. 10 (plan de HACCP), Art. 15 (trazabilidad)',
'Registrar el establecimiento en SEREMI de Salud. Implementar plan HACCP documentado. Mantener trazabilidad de materias primas y productos.',
'Registro establecimiento SEREMI, plan HACCP documentado, registros de trazabilidad, registros de temperatura',
'https://www.bcn.cl/leychile/navegar?idNorma=1058839'),

-- ============================================================
--  NORMATIVA LABORAL GENERAL (aplica a todas las normas ISO)
-- ============================================================
('General', 'Código del Trabajo', 'DFL-1', 'Código', 'Código del Trabajo',
'Marco legal de las relaciones laborales en Chile.',
'Art. 22 (jornada laboral), Art. 67 (feriado anual), Art. 162 (finiquito), Art. 174 (fuero maternal), Art. 194-208 (protección maternidad)',
'Cumplir con jornada máxima legal, pago de horas extras, feriados, licencias y protección de la maternidad.',
'Contratos de trabajo, registros de asistencia, liquidaciones de sueldo, finiquitos',
'https://www.bcn.cl/leychile/navegar?idNorma=207436'),

('General', 'Ley 20.348', '20.348', 'Ley', 'Igualdad de Remuneraciones entre Hombres y Mujeres',
'Obliga a respetar el principio de igualdad de remuneraciones sin discriminación por género.',
'Art. 62 bis CT (obligación de igual remuneración por igual trabajo)',
'Realizar análisis de brechas salariales. Documentar criterios objetivos de remuneración.',
'Análisis de brechas salariales, política de remuneraciones, descripción de cargos',
'https://www.bcn.cl/leychile/navegar?idNorma=1010133'),

('General', 'Ley 21.015', '21.015', 'Ley', 'Ley de Inclusión Laboral de Personas con Discapacidad',
'Obliga a empresas con 100 o más trabajadores a contratar al menos 1% de personas con discapacidad.',
'Art. 157 bis CT (cuota del 1%), Art. 157 ter (medidas alternativas)',
'Si tiene 100 o más trabajadores, contratar personas con discapacidad o implementar medida alternativa y registrar en SENCE.',
'Registro en SENCE, contratos de trabajadores con discapacidad o evidencia de medida alternativa',
'https://www.bcn.cl/leychile/navegar?idNorma=1103997');

-- Verificar inserción
SELECT norma_iso, COUNT(*) as total FROM normaai_kb GROUP BY norma_iso ORDER BY norma_iso;
