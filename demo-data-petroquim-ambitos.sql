-- demo-data-petroquim-ambitos.sql
-- Asigna el campo "ambito" a los 17 requisitos existentes de Petroquim
-- (11 de demo-data-petroquim.sql + 6 de demo-data-petroquim-compliance.sql)
-- para que se agrupen visualmente en el dashboard por área de compliance.
--
-- Ejecutar DESPUÉS de correr migration-v8-ambito-compliance.sql, con el
-- mismo UUID de Petroquim (c8503d44-00cc-494f-84a9-74eb00dc37ef).

DO $$
DECLARE
  v_uid UUID := 'c8503d44-00cc-494f-84a9-74eb00dc37ef'::UUID;
BEGIN

UPDATE normaai_requisitos SET ambito = 'Medio Ambiente'
WHERE user_id = v_uid AND cuerpo_legal IN (
  'Ley 20.920 — Ley REP (Responsabilidad Extendida del Productor)',
  'Ley 20.920 — Ley REP',
  'Ley 19.300 — Bases Generales del Medio Ambiente',
  'DS N°138 — Declaración de Emisiones al Aire',
  'RETC — Registro de Emisiones y Transferencia de Contaminantes'
);

UPDATE normaai_requisitos SET ambito = 'Seguridad'
WHERE user_id = v_uid AND cuerpo_legal IN (
  'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas',
  'Ley 16.744 — Seguridad y Salud Laboral',
  'DS N°594 — Condiciones Sanitarias y Ambientales en Lugares de Trabajo',
  'Comité Paritario de Higiene y Seguridad — Código del Trabajo'
);

UPDATE normaai_requisitos SET ambito = 'Laboral'
WHERE user_id = v_uid AND cuerpo_legal = 'Código del Trabajo';

UPDATE normaai_requisitos SET ambito = 'Penal'
WHERE user_id = v_uid AND cuerpo_legal = 'Ley 20.393 — Responsabilidad Penal de las Personas Jurídicas';

UPDATE normaai_requisitos SET ambito = 'Tributario'
WHERE user_id = v_uid AND cuerpo_legal = 'Ley N°21.713 — Ley de Cumplimiento Tributario';

UPDATE normaai_requisitos SET ambito = 'Internacional'
WHERE user_id = v_uid AND cuerpo_legal = 'Ley 20.393 / Código Penal Art. 251 bis';

UPDATE normaai_requisitos SET ambito = 'Financiero'
WHERE user_id = v_uid AND cuerpo_legal = 'Ley N°19.913 — Crea la Unidad de Análisis Financiero';

UPDATE normaai_requisitos SET ambito = 'Tecnológico'
WHERE user_id = v_uid AND cuerpo_legal = 'Ley N°21.719 — Protección de Datos Personales';

END $$;
