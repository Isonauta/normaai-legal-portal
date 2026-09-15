-- demo-data-solucorp.sql
-- Datos demo para Solucorp (Industrial y Comercial Solucorp Ltda.) —
-- fabricación e impresión de etiquetas, embalajes e insumos de packaging
-- para el mercado industrial, incluyendo soluciones de etiquetado y
-- equipamiento de fin de línea productiva.
--
-- Organizado en las 6 categorías que Anita Tapia (Jefe de Aseguramiento
-- de Calidad, Solucorp) pidió por correo: T1 Legislación General,
-- T2 Legislación Laboral, T3 Seguridad y Salud Ocupacional,
-- T4 Medio Ambiente, T5 Sustancias Peligrosas, T6 Alimentos.
--
-- INSTRUCCIONES:
--   1. En /admin → Clientes → "Crear cliente": crea demo@solucorp.cl
--      (nombre: Solucorp Demo, empresa: Solucorp, clave: Solucorp). Esto
--      crea el usuario en auth.users Y la fila en normaai_clientes en un
--      solo paso ya validado por la app — no lo reemplaces por un INSERT
--      manual.
--   2. Inicia sesión como demo@solucorp.cl y completa el onboarding
--      guiado con estos valores:
--        · Rubro: Fabricación e impresión de etiquetas, embalajes e
--          insumos de packaging para el mercado industrial, incluyendo
--          soluciones de etiquetado y equipamiento de fin de línea
--          productiva
--        · Normas ISO: 9001, 14001, 45001
--        · Sitios de trabajo: Planta de producción Santiago
--      (Este script también fija estos mismos valores por SQL en el
--      paso 3, así que si no alcanzas a hacer el onboarding a mano
--      antes de la reunión, igual queda correcto.)
--   3. Copia el UUID del usuario desde auth.users y reemplaza
--      DEMO_USER_ID_AQUI abajo. Ejecuta este script en Supabase → SQL
--      Editor para cargar los requisitos de ejemplo.
--
-- Nota: el rubro y el sitio están tomados de las políticas de Calidad,
-- Medio Ambiente y Seguridad y Salud Ocupacional que Cristián adjuntó,
-- más el sitio web de Solucorp. Si Solucorp precisa el sitio/planta
-- exacto (dirección, comuna) antes de la reunión, ajustar este script.

DO $$
DECLARE
  v_uid UUID := 'DEMO_USER_ID_AQUI'::UUID;  -- <- REEMPLAZAR
  v_emp TEXT := 'Solucorp';
BEGIN

-- Fijar perfil (rubro / sitios) usado como contexto del agente Norma AI,
-- por si el onboarding manual no alcanza a completarse antes de la demo
UPDATE normaai_clientes
SET rubro  = 'Fabricación e impresión de etiquetas, embalajes e insumos de packaging para el mercado industrial, incluyendo soluciones de etiquetado y equipamiento de fin de línea productiva',
    sitios = 'Planta de producción Santiago'
WHERE user_id = v_uid;

-- ════════════════════════════════════════════════════════════
-- T1. LEGISLACIÓN GENERAL
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'Ley de Rentas Municipales — Patente Comercial e Industrial', 'Art. 23° y ss.',
 'La planta de producción debe operar con patente municipal comercial e industrial vigente ante la municipalidad correspondiente.',
 'SI', 'Gerencia General', 'Patente municipal vigente, pago al día.', 10),

(v_uid, v_emp, 'CL', 'Código Sanitario', 'Resolución Sanitaria de funcionamiento del establecimiento industrial',
 'El establecimiento industrial debe contar con Resolución Sanitaria de funcionamiento vigente otorgada por la autoridad sanitaria regional.',
 'SI', 'Gerencia General', 'Resolución Sanitaria vigente, sin observaciones en última inspección.', 20),

-- ════════════════════════════════════════════════════════════
-- T2. LEGISLACIÓN LABORAL
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Código del Trabajo', 'Art. 67° y ss. — Reglamento Interno de Orden, Higiene y Seguridad',
 'Mantener vigente y difundido el Reglamento Interno de Orden, Higiene y Seguridad, registrado ante la Inspección del Trabajo.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado, registrado y entregado a todos los colaboradores.', 30),

(v_uid, v_emp, 'CL', 'Código del Trabajo', 'Contratos de trabajo escritos y Libro de Remuneraciones Electrónico',
 'Todos los colaboradores deben contar con contrato de trabajo escrito y sus remuneraciones deben declararse a través del Libro de Remuneraciones Electrónico.',
 'SI', 'Gerencia RRHH', 'Contratos al día y LRE presentado mensualmente sin observaciones.', 40),

(v_uid, v_emp, 'CL', 'Ley N°21.561 — Reducción de la Jornada Laboral a 40 Horas', 'Calendario de implementación gradual',
 'Ajuste gradual de la jornada laboral semanal conforme al calendario legal de reducción a 40 horas, incluyendo turnos de producción e impresión.',
 'PENDIENTE', 'Gerencia RRHH', 'Rediseño de turnos de planta en evaluación para la siguiente etapa de reducción.', 50),

-- ════════════════════════════════════════════════════════════
-- T3. SEGURIDAD Y SALUD OCUPACIONAL
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguro Social contra Riesgos de Accidentes del Trabajo y Enfermedades Profesionales', 'Afiliación y cotización a mutualidad',
 'Afiliación vigente a mutualidad y pago oportuno de cotizaciones para todos los colaboradores de planta y administración.',
 'SI', 'Gerencia RRHH', 'Afiliación vigente, cotizaciones al día.', 60),

(v_uid, v_emp, 'CL', 'DS N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 53°, 75° y 82° — Ruido y ventilación en líneas de impresión',
 'Control de exposición ocupacional a ruido de maquinaria y a solventes/COV de las líneas de impresión flexográfica, con ventilación adecuada.',
 'NO', 'Jefe HSE', NULL, 70),

(v_uid, v_emp, 'CL', 'DS N°40 — Reglamento sobre Prevención de Riesgos Profesionales', 'Comité Paritario y Departamento de Prevención de Riesgos',
 'Constitución y funcionamiento del Comité Paritario de Higiene y Seguridad y del Departamento de Prevención de Riesgos, según dotación de la planta.',
 'SI', 'Jefe HSE', 'Comité Paritario constituido y Depto. de Prevención de Riesgos operativo, actas al día.', 80),

-- ════════════════════════════════════════════════════════════
-- T4. MEDIO AMBIENTE
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 19.300 — Bases Generales del Medio Ambiente', 'Permisos ambientales sectoriales de la planta',
 'La operación de la planta debe contar con los permisos ambientales sectoriales que correspondan según el proceso productivo (impresión, emisiones, residuos).',
 'SI', 'Gerencia Ambiental', 'Permisos sectoriales vigentes, sin observaciones en fiscalizaciones.', 90),

(v_uid, v_emp, 'CL', 'Ley 20.920 — Ley REP (Responsabilidad Extendida del Productor)', 'Art. 3° — Productos prioritarios: envases y embalajes',
 'Como fabricante de etiquetas y embalajes, Solucorp debe inscribirse en el Registro de Productores (RETC) y reportar anualmente las cantidades puestas en el mercado.',
 'PENDIENTE', 'Gerencia Ambiental', 'Inscripción en Registro de Productores REP en trámite.', 100),

(v_uid, v_emp, 'CL', 'RETC — Registro de Emisiones y Transferencia de Contaminantes', 'Declaración de emisiones atmosféricas por compuestos orgánicos volátiles (COV)',
 'Declaración anual de emisiones de COV asociadas a tintas y solventes de las líneas de impresión.',
 'NO', 'Gerencia Ambiental', NULL, 110),

-- ════════════════════════════════════════════════════════════
-- T5. SUSTANCIAS PELIGROSAS
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DS N°43 — Reglamento de Almacenamiento de Sustancias Peligrosas', 'Art. 22° — Almacenamiento de solventes y tintas de impresión',
 'El almacenamiento de solventes, tintas y diluyentes usados en las líneas de impresión flexográfica debe contar con hojas de datos de seguridad, señalización y compatibilidad química.',
 'NO', 'Jefe HSE', NULL, 120),

(v_uid, v_emp, 'CL', 'NCh 382 — Clasificación y Etiquetado de Sustancias Peligrosas', 'Rotulado de envases de solventes y tintas',
 'Los envases de solventes y tintas almacenados en planta deben contar con rotulado según la clasificación de riesgo NCh 382.',
 'SI', 'Jefe HSE', 'Rotulado de envases verificado en última auditoría interna.', 130),

-- ════════════════════════════════════════════════════════════
-- T6. ALIMENTOS
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Reglamento Sanitario de los Alimentos (DS N°977)', 'Título XIV — Envases y utensilios en contacto con alimentos',
 'Las etiquetas y materiales de embalaje destinados a productos alimenticios de clientes deben cumplir los requisitos de materiales aptos para uso alimentario, sin migración de sustancias a los alimentos.',
 'NO', 'Gerencia de Calidad', NULL, 140),

(v_uid, v_emp, 'CL', 'Registro ISP de materiales de envase en contacto con alimentos', 'Ensayo de migración de tintas y adhesivos',
 'Los insumos de impresión (tintas, adhesivos) usados en etiquetas para envases alimentarios deben contar con ensayos de migración vigentes ante el ISP cuando corresponda.',
 'PENDIENTE', 'Gerencia de Calidad', 'Ensayos de migración en trámite para la nueva línea de tintas de bajo migración.', 150);

END $$;
