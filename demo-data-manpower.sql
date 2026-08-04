-- demo-data-manpower.sql
-- Datos demo para ManpowerGroup — demo miércoles
-- INSTRUCCIONES:
--   1. Crea el usuario demo: demo@manpowergroup.cl (contraseña: ManpowerDemo2026)
--   2. Copia su UUID desde auth.users y reemplaza DEMO_USER_ID_AQUI
--   3. Ejecuta este script en Supabase → SQL Editor

DO $$
DECLARE
  v_uid UUID := 'DEMO_USER_ID_AQUI'::UUID;  -- <- REEMPLAZAR
  v_emp TEXT := 'ManpowerGroup Chile';
BEGIN

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 21.643 (Ley Karin) — Prevención de acoso
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'Ley 21.643 — Ley Karin (Acoso laboral y sexual)', 'Art. 1°',
 'Incorporación al Reglamento Interno de disposiciones sobre prevención, investigación y sanción del acoso laboral, sexual y violencia en el trabajo.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado en agosto 2025, versión 3.2 disponible en intranet corporativa.', 10),

(v_uid, v_emp, 'CL', 'Ley 21.643 — Ley Karin (Acoso laboral y sexual)', 'Art. 4°',
 'Canal de denuncia formal, confidencial y seguro habilitado para recibir denuncias de acoso laboral o sexual.',
 'SI', 'Gerencia RRHH', 'Canal online en portal interno + correo denuncia@manpowergroup.cl operativo.', 20),

(v_uid, v_emp, 'CL', 'Ley 21.643 — Ley Karin (Acoso laboral y sexual)', 'Art. 5°',
 'Protocolo de prevención del acoso sexual y violencia en el trabajo elaborado con participación de trabajadores.',
 'SI', 'Subgerente Cumplimiento', 'Protocolo vigente, validado con el comité bipartito en junio 2025.', 30),

(v_uid, v_emp, 'CL', 'Ley 21.643 — Ley Karin (Acoso laboral y sexual)', 'Art. 6°',
 'Procedimiento de investigación interna que debe concluir en un plazo máximo de 30 días hábiles desde la denuncia.',
 'PENDIENTE', 'Jefa Legal', 'Procedimiento en revisión; faltan capacitar a los investigadores internos designados.', 40),

(v_uid, v_emp, 'CL', 'Ley 21.643 — Ley Karin (Acoso laboral y sexual)', 'Art. 7°',
 'Medidas de resguardo inmediato para el denunciante durante la investigación (cambio de turno, lugar, etc.).',
 'PENDIENTE', 'Jefa Legal', 'Protocolo de medidas de resguardo pendiente de aprobación por Directorio.', 50),

-- ════════════════════════════════════════════════════════════
-- CHILE — Código del Trabajo — Subcontratación
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Código del Trabajo — Subcontratación (Art. 183-A y ss.)', 'Art. 183-A',
 'La empresa principal es responsable subsidiaria de las obligaciones laborales y previsionales de los contratistas cuando el trabajador ha prestado servicios en su obra.',
 'SI', 'Gerencia Legal', 'Contratos de subcontratación incluyen cláusula de responsabilidad y exigencia de certificados al día.', 60),

(v_uid, v_emp, 'CL', 'Código del Trabajo — Subcontratación (Art. 183-A y ss.)', 'Art. 183-C',
 'La empresa principal debe exigir mensualmente a los contratistas certificados de cumplimiento de obligaciones laborales y previsionales.',
 'SI', 'Administración Contratos', 'Control mensual vía sistema SAP: certificados F30 y F30-1 exigidos el primer día hábil de cada mes.', 70),

(v_uid, v_emp, 'CL', 'Código del Trabajo — Subcontratación (Art. 183-A y ss.)', 'Art. 183-E',
 'La empresa principal debe velar por el cumplimiento de normas de higiene y seguridad respecto de los trabajadores de sus contratistas.',
 'NO', 'Gerencia Operaciones', NULL, 80),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 16.744 — Accidentes del trabajo
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 67°',
 'Reglamento Interno debe incluir normas de higiene y seguridad. Debe ser enviado al Ministerio del Trabajo y a la Mutual.',
 'SI', 'Gerencia RRHH', 'RIOHS enviado a Suseso y Mutual ACHS. Último envío: marzo 2025.', 90),

(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 68°',
 'El empleador debe implementar todas las medidas de higiene y seguridad en el trabajo exigidas por las disposiciones legales.',
 'SI', 'Jefe Prevención de Riesgos', 'Programa de prevención vigente; 14 capacitaciones ejecutadas en 2025 (acta adjunta).', 100),

(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 76°',
 'Todo accidente del trabajo debe ser notificado a la Mutual dentro de las 24 horas. Registro de accidentabilidad actualizado.',
 'SI', 'Jefe Prevención de Riesgos', 'Sistema de notificación en línea ACHS integrado. Tasa accidentabilidad 2025: 0.8%.', 110),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 21.719 — Protección de datos personales
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 21.719 — Protección de Datos Personales', 'Art. 13°',
 'El tratamiento de datos personales requiere una base de legitimación válida (consentimiento, contrato, obligación legal, interés legítimo).',
 'PENDIENTE', 'DPO / Legal', 'Revisión de bases de legitimación en curso. Pendiente: base candidatos y base clientes.', 120),

(v_uid, v_emp, 'CL', 'Ley 21.719 — Protección de Datos Personales', 'Art. 14°',
 'El consentimiento para tratamiento de datos debe ser libre, informado, específico, inequívoco y, en ciertos casos, por escrito.',
 'NO', 'DPO / Legal', NULL, 130),

(v_uid, v_emp, 'CL', 'Ley 21.719 — Protección de Datos Personales', 'Art. 20°',
 'Garantizar los derechos del titular: acceso, rectificación, cancelación, oposición y portabilidad (ARCO+P).',
 'PENDIENTE', 'DPO / Legal', 'Canal de ejercicio de derechos habilitado, pero SLA de respuesta (15 días) sin procedimiento formal.', 140),

(v_uid, v_emp, 'CL', 'Ley 21.719 — Protección de Datos Personales', 'Art. 30°',
 'Mantener un Registro de Actividades de Tratamiento (RAT) actualizado con finalidades, categorías de datos y destinatarios.',
 'NO', 'DPO / Legal', NULL, 150),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 21.015 — Inclusión laboral
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 21.015 — Inclusión Laboral (Discapacidad)', 'Art. 157 bis CT',
 'Empresas de 100 o más trabajadores deben contratar o mantener contratadas al menos el 1% de personas con discapacidad o pensión de invalidez.',
 'SI', 'Gerencia RRHH', '43 personas con discapacidad incorporadas al 30/06/2025, sobre una plantilla de 3.800 (1,13%). Registro SENCE vigente.', 160),

(v_uid, v_emp, 'CL', 'Ley 21.015 — Inclusión Laboral (Discapacidad)', 'Art. 157 ter CT',
 'Si no es posible alcanzar el 1%, el empleador debe adoptar medidas alternativas y reportarlas a la Dirección del Trabajo.',
 'NO_APLICA', 'Gerencia RRHH', 'No aplica: la empresa cumple la cuota del 1% directamente.', 170),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 21.220 — Teletrabajo
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 21.220 — Teletrabajo y trabajo a distancia', 'Art. 152 quáter G CT',
 'El contrato de teletrabajo debe constar por escrito e indicar el lugar donde se prestarán los servicios remotos.',
 'SI', 'Administración Contratos', 'Addendum de teletrabajo firmado por 100% de trabajadores en modalidad remota (856 personas).', 180),

(v_uid, v_emp, 'CL', 'Ley 21.220 — Teletrabajo y trabajo a distancia', 'Art. 152 quáter J CT',
 'Derecho a desconexión digital: el empleador debe garantizar al trabajador al menos 12 horas continuas de desconexión en cada período de 24 horas.',
 'SI', 'Gerencia RRHH', 'Política de desconexión implementada en política de uso de tecnología v2.0, marzo 2025.', 190),

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley 20.348 — Igualdad salarial
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 20.348 — Igualdad de Remuneración (Art. 62 bis CT)', 'Art. 62 bis CT',
 'El empleador debe cumplir con el principio de igualdad de remuneraciones entre hombres y mujeres que realicen el mismo trabajo.',
 'SI', 'Gerencia RRHH', 'Estudio de brecha salarial realizado en enero 2025. Brecha ajustada: 1,2%. Plan corrección activado.', 200),

-- ════════════════════════════════════════════════════════════
-- PERÚ — Ley 29783 — Seguridad y Salud en el Trabajo
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'PE', 'Ley 29783 — Seguridad y Salud en el Trabajo (Perú)', 'Art. 22°',
 'El empleador debe elaborar, implementar y mantener una Política de Seguridad y Salud en el Trabajo, difundida a todos los trabajadores.',
 'SI', 'Gerencia RRHH Perú', 'Política SST Perú vigente desde enero 2025, publicada en intranet y mural informativo todas las sedes.', 210),

(v_uid, v_emp, 'PE', 'Ley 29783 — Seguridad y Salud en el Trabajo (Perú)', 'Art. 28°',
 'Elaborar y conservar el Reglamento Interno de Seguridad y Salud en el Trabajo (RISST), con participación de los trabajadores.',
 'SI', 'Gerencia RRHH Perú', 'RISST aprobado en abril 2025. Copia entregada a todos los trabajadores (constancia firmada).', 220),

(v_uid, v_emp, 'PE', 'Ley 29783 — Seguridad y Salud en el Trabajo (Perú)', 'Art. 32°',
 'Contar con una Matriz de Identificación de Peligros, Evaluación de Riesgos y Controles (IPERC) actualizada para todas las actividades.',
 'PENDIENTE', 'Jefe SST Perú', 'IPERC vigente para Lima y Arequipa. Pendiente actualización para operaciones en Trujillo (nueva sede 2025).', 230),

(v_uid, v_emp, 'PE', 'Ley 29783 — Seguridad y Salud en el Trabajo (Perú)', 'Art. 34°',
 'Implementar un Plan Anual de Seguridad y Salud en el Trabajo (PASST) y reportar su ejecución al Comité SST.',
 'SI', 'Jefe SST Perú', 'PASST 2025 aprobado en diciembre 2024. Ejecución al 68% a julio 2025 (dentro de cronograma).', 240),

(v_uid, v_emp, 'PE', 'Ley 29783 — Seguridad y Salud en el Trabajo (Perú)', 'Art. 49°',
 'El empleador debe garantizar la realización de exámenes médicos ocupacionales al inicio, durante y al término de la relación laboral.',
 'NO', 'Administración RRHH Perú', NULL, 250),

-- ════════════════════════════════════════════════════════════
-- PERÚ — Decreto Legislativo 728 — Contratación laboral
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'PE', 'Decreto Legislativo 728 — Contratación Laboral', 'Art. 4°',
 'Los contratos sujetos a modalidad (plazo fijo) deben constar por escrito y presentarse ante la SUNAFIL dentro de los 15 días siguientes a su suscripción.',
 'SI', 'Administración Contratos Perú', 'Contratos registrados en sistema SUNAFIL. Cumplimiento del plazo: 98,7% en 2025 (23 contratos pendientes de revisión).', 260),

(v_uid, v_emp, 'PE', 'Decreto Legislativo 728 — Contratación Laboral', 'Art. 63°',
 'Las causales de contratación temporal deben ser reales y relacionadas con necesidades transitorias, de mercado o de inicio de actividad.',
 'PENDIENTE', 'Gerencia Legal Perú', 'Auditoría interna en curso para verificar causalidad en 340 contratos por inicio de actividad vigentes.', 270),

(v_uid, v_emp, 'PE', 'Decreto Legislativo 728 — Contratación Laboral', 'Art. 77°',
 'Un contrato modal se desnaturaliza (pasa a ser indefinido) si excede el plazo máximo legal o si el trabajador continúa laborando luego de su vencimiento.',
 'SI', 'Administración Contratos Perú', 'Sistema de alertas automáticas 30 días antes del vencimiento. Tasa desnaturalización 2025: 0,3%.', 280),

-- ════════════════════════════════════════════════════════════
-- PERÚ — Ley 29733 — Protección de datos
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'PE', 'Ley 29733 — Protección de Datos Personales (Perú)', 'Art. 6°',
 'El tratamiento de datos personales debe contar con el consentimiento escrito, previo, expreso e inequívoco del titular.',
 'PENDIENTE', 'DPO Perú', 'Revisión de formularios de consentimiento en candidatos: 3 de 7 procesos actualizados.', 290),

(v_uid, v_emp, 'PE', 'Ley 29733 — Protección de Datos Personales (Perú)', 'Art. 13°',
 'Los bancos de datos personales de titularidad privada deben inscribirse en el Registro Nacional de Protección de Datos Personales (RNPDP) de la ANPD.',
 'NO', 'DPO Perú', NULL, 300),

(v_uid, v_emp, 'PE', 'Ley 29733 — Protección de Datos Personales (Perú)', 'Art. 21°',
 'Las transferencias internacionales de datos solo pueden realizarse hacia países que cuenten con nivel de protección adecuado o con garantías suficientes.',
 'PENDIENTE', 'DPO / Legal', 'Análisis de flujos transfronterizos en proceso (herramienta de mapeo en uso desde julio 2025).', 310),

-- ════════════════════════════════════════════════════════════
-- PERÚ — Ley 30709 — Igualdad salarial
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'PE', 'Ley 30709 — No discriminación remunerativa (Perú)', 'Art. 3°',
 'El empleador debe elaborar un cuadro de categorías y funciones con los cargos existentes en la empresa, diferenciando las remuneraciones por puesto.',
 'SI', 'Gerencia RRHH Perú', 'Cuadro de categorías aprobado por Directorio Perú en febrero 2025. Incluye 48 familias de cargos.', 320),

(v_uid, v_emp, 'PE', 'Ley 30709 — No discriminación remunerativa (Perú)', 'Art. 4°',
 'Está prohibido establecer diferencias remunerativas entre hombres y mujeres basadas en el sexo cuando se trate del mismo trabajo.',
 'SI', 'Gerencia RRHH Perú', 'Brecha salarial ajustada Perú: 0,8% (auditado por PwC, mayo 2025). Sin diferencias por género en mismo cargo.', 330),

-- ════════════════════════════════════════════════════════════
-- PERÚ — Ley 27942 — Hostigamiento sexual
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'PE', 'Ley 27942 — Prevención y Sanción del Hostigamiento Sexual (Perú)', 'Art. 8°',
 'El empleador debe implementar mecanismos de prevención del hostigamiento sexual y canales de denuncia accesibles.',
 'SI', 'Gerencia RRHH Perú', 'Canal de denuncia habilitado. Responsable de investigación designado. Dos investigaciones concluidas en 2025.', 340),

(v_uid, v_emp, 'PE', 'Ley 27942 — Prevención y Sanción del Hostigamiento Sexual (Perú)', 'Art. 25°',
 'El Reglamento Interno de Trabajo debe incluir disposiciones sobre prevención y sanción del hostigamiento sexual.',
 'SI', 'Gerencia Legal Perú', 'RIT actualizado en enero 2025. Sección 8.3 contiene procedimiento completo (denuncia, investigación, sanción).', 350),

-- ════════════════════════════════════════════════════════════
-- PERÚ — Ley 29973 — Personas con discapacidad
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'PE', 'Ley 29973 — Derechos de las Personas con Discapacidad (Perú)', 'Art. 45°',
 'Las empresas con más de 50 trabajadores deben contratar personas con discapacidad en una proporción no inferior al 3% de la totalidad de su personal.',
 'NO', 'Gerencia RRHH Perú', NULL, 360),

(v_uid, v_emp, 'PE', 'Ley 29973 — Derechos de las Personas con Discapacidad (Perú)', 'Art. 46°',
 'Las personas con discapacidad no pueden ser discriminadas en los procesos de selección ni en las condiciones de trabajo por razones de discapacidad.',
 'SI', 'Gerencia RRHH Perú', 'Política de inclusión Perú vigente. Procesos de selección revisados para eliminar barreras (evaluaciones en formato accesible).', 370);

END $$;
