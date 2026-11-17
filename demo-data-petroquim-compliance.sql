-- demo-data-petroquim-compliance.sql
-- Amplía la matriz de Petroquim con los 8 ámbitos de Compliance que pidió
-- el cliente (laboral, seguridad, medio ambiente, penal, tributario,
-- internacional, financiero y tecnológico). La matriz original
-- (demo-data-petroquim.sql) ya cubre Seguridad (Ley 16.744, DS 594,
-- Comité Paritario), Medio Ambiente (Ley 19.300, DS 138, RETC) y parte
-- de Sustancias Peligrosas. Este script agrega los 6 ámbitos restantes:
-- Laboral (puro, más allá de seguridad), Penal, Tributario, Internacional,
-- Financiero y Tecnológico.
--
-- Ejecutar DESPUÉS de demo-data-petroquim.sql, con el mismo UUID ya usado
-- (el que Cristián confirmó: c8503d44-00cc-494f-84a9-74eb00dc37ef). No es
-- idempotente: si se corre dos veces, duplica las filas.

DO $$
DECLARE
  v_uid UUID := 'c8503d44-00cc-494f-84a9-74eb00dc37ef'::UUID;
  v_emp TEXT := 'Petroquim';
BEGIN

-- ════════════════════════════════════════════════════════════
-- LABORAL — Código del Trabajo (más allá de seguridad y salud)
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'Código del Trabajo', 'Art. 9° — Contratos de trabajo escritos y Libro de Remuneraciones Electrónico',
 'Todos los colaboradores de planta y administración deben contar con contrato de trabajo escrito, y las remuneraciones deben declararse a través del Libro de Remuneraciones Electrónico.',
 'SI', 'Gerencia RRHH', 'Contratos al día, LRE presentado mensualmente sin observaciones.', 120),

-- ════════════════════════════════════════════════════════════
-- PENAL — Ley 20.393, Responsabilidad Penal de las Personas Jurídicas
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 20.393 — Responsabilidad Penal de las Personas Jurídicas', 'Art. 4° — Modelo de Prevención de Delitos',
 'La empresa debe contar con un modelo de prevención de delitos (cohecho, lavado de activos, receptación, administración desleal, negociación incompatible, corrupción entre particulares) implementado y, cuando corresponda, certificado.',
 'PENDIENTE', 'Gerencia General', 'Modelo de prevención en elaboración con asesoría externa; falta designación formal de encargado de prevención.', 130),

-- ════════════════════════════════════════════════════════════
-- TRIBUTARIO — Ley 21.713, Cumplimiento Tributario
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley N°21.713 — Ley de Cumplimiento Tributario', 'Fortalecimiento del cumplimiento y facultades fiscalizadoras del SII',
 'La empresa debe ajustar sus procesos de facturación, declaración y pago de impuestos a las nuevas obligaciones y estándares de cumplimiento tributario reforzado.',
 'SI', 'Gerencia de Finanzas', 'Facturación electrónica y declaraciones mensuales al día; revisión de procesos internos con auditor tributario externo.', 140),

-- ════════════════════════════════════════════════════════════
-- INTERNACIONAL — Cohecho a funcionario público extranjero
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 20.393 / Código Penal Art. 251 bis', 'Cohecho a funcionario público extranjero',
 'En operaciones de importación de resinas y comercio exterior, la empresa debe prevenir el cohecho a funcionarios públicos extranjeros (aduanas, autoridades sanitarias de otros países).',
 'PENDIENTE', 'Gerencia General', 'Política anticorrupción en revisión para incorporar cláusula específica de comercio exterior.', 150),

-- ════════════════════════════════════════════════════════════
-- FINANCIERO — Ley 19.913, Unidad de Análisis Financiero (UAF)
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley N°19.913 — Crea la Unidad de Análisis Financiero', 'Prevención de lavado de activos y financiamiento del terrorismo',
 'Evaluar si la empresa califica como sujeto obligado a reportar operaciones sospechosas a la UAF, dado el volumen de pagos internacionales por importación de materias primas.',
 'PENDIENTE', 'Gerencia de Finanzas', 'Evaluación de calidad de sujeto obligado en curso con asesoría legal.', 160),

-- ════════════════════════════════════════════════════════════
-- TECNOLÓGICO — Ley 21.719, Protección de Datos Personales
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley N°21.719 — Protección de Datos Personales', 'Tratamiento de datos de trabajadores y clientes',
 'Implementar medidas de seguridad de la información y bases de licitud para el tratamiento de datos personales de colaboradores y clientes, conforme a la nueva ley de protección de datos.',
 'NO', 'Gerencia de Operaciones', NULL, 170);

END $$;
