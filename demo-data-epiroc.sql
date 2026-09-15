-- demo-data-epiroc.sql
-- Datos demo para Epiroc Chile S.A.C. — comercialización, venta y
-- servicio técnico de equipos de perforación y excavación de roca
-- (drill rigs), herramientas y accesorios, repuestos y consumibles para
-- minería e infraestructura.
--
-- A diferencia de las demos anteriores, estos 20 requisitos NO son
-- inventados: están tomados directamente de la matriz real de Epiroc
-- (Matriz_Requisitos_Legales_Epiroc_20.05.2026_V.01.xlsx) que Cristián
-- compartió, filtrando ~20 de las cientas de filas de esa matriz (cubre
-- decenas de categorías: Comité Paritario, EPP, Vehículos, Sustancias
-- Peligrosas, Residuos Peligrosos, Subcontratación, etc.) — es demasiado
-- grande para cargarla completa en una demo. Se priorizaron las
-- categorías más relevantes a lo que Epiroc realmente hace en Chile
-- (venta y servicio técnico en sus 3 Customer Centers), y se incluyeron
-- las brechas reales que la propia matriz de Epiroc ya documenta
-- (Programa MEHM, Protocolo TMERT, y gestión de contratistas/
-- subcontratación), en vez de brechas ficticias.
--
-- INSTRUCCIONES:
--   1. En /admin → Clientes → "Crear cliente": crea demo@epiroc.cl
--      (nombre: Epiroc Demo, empresa: Epiroc Chile, clave: Epiroc). Esto
--      crea el usuario en auth.users Y la fila en normaai_clientes en un
--      solo paso ya validado por la app — no lo reemplaces por un INSERT
--      manual.
--   2. Inicia sesión como demo@epiroc.cl y completa el onboarding guiado
--      con estos valores (o deja que el paso 3 de este script los fije
--      igual, por si no alcanzas a hacerlo a mano):
--        · Rubro: Comercialización, venta y servicio técnico de equipos
--          de perforación y excavación de roca, herramientas y
--          accesorios, repuestos y consumibles para minería e
--          infraestructura
--        · Normas ISO: 9001, 14001, 45001 (certificado LRQA N°10684275,
--          vigente hasta el 05-05-2028)
--        · Sitios de trabajo: Customer Center Antofagasta, Customer
--          Center Copiapó, Customer Center Santiago (Conchalí)
--   3. Copia el UUID del usuario desde auth.users y reemplaza
--      DEMO_USER_ID_AQUI abajo. Ejecuta este script en Supabase → SQL
--      Editor para cargar los requisitos.

DO $$
DECLARE
  v_uid UUID := 'c928409f-d7c4-4d17-bb70-baa0466d5bad'::UUID;
  v_emp TEXT := 'Epiroc Chile';
BEGIN

UPDATE normaai_clientes
SET rubro  = 'Comercialización, venta y servicio técnico de equipos de perforación y excavación de roca, herramientas y accesorios, repuestos y consumibles para minería e infraestructura',
    normas_iso = 'ISO 9001, ISO 14001, ISO 45001',
    sitios = 'Customer Center Antofagasta, Customer Center Copiapó, Customer Center Santiago (Conchalí)',
    onboarding_completado = true
WHERE user_id = v_uid;

-- ════════════════════════════════════════════════════════════
-- SEGURIDAD Y SALUD OCUPACIONAL — extraído de la matriz real de Epiroc
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'DFL N°1 — Código del Trabajo', 'Art. 184 (inciso 1°)',
 'El empleador está obligado a tomar todas las medidas necesarias para proteger eficazmente la vida y salud de los trabajadores, informando de los riesgos y manteniendo condiciones adecuadas de higiene y seguridad en las faenas.',
 'SI', 'Jefe HSE', 'Cumplimiento legal y en instalaciones verificado en visita de mayo 2026.', 10),

(v_uid, v_emp, 'CL', 'DFL N°1 — Código del Trabajo', 'Art. 243 — Fuero de representantes del Comité Paritario',
 'Los representantes titulares de los trabajadores en el Comité Paritario gozan de fuero; su reemplazo debe comunicarse por escrito a la administración.',
 'SI', 'Gerencia RRHH', 'Constitución de Comité Paritario y actas de reunión vigentes, verificado mayo 2026.', 20),

(v_uid, v_emp, 'CL', 'Ley N°16.744', 'Art. 66 — Constitución del Comité Paritario',
 'En toda industria o faena donde trabajen más de 25 personas deben funcionar uno o más Comités Paritarios de Higiene y Seguridad.',
 'SI', 'Gerencia RRHH', 'Comité Paritario constituido en los 3 Customer Centers, actas de reunión al día.', 30),

(v_uid, v_emp, 'CL', 'D.S. N°44 — Reglamento sobre gestión preventiva de riesgos laborales', 'Art. 50 — Departamento de Prevención de Riesgos',
 'Las entidades empleadoras con más de 100 trabajadores deben contar con un Departamento de Prevención de Riesgos dirigido por un experto con autonomía técnica.',
 'SI', 'Jefe HSE', 'Departamento de Prevención de Riesgos operativo, verificación documental y en terreno mayo 2026.', 40),

(v_uid, v_emp, 'CL', 'DFL N°1 — Código del Trabajo', 'Art. 153 — Reglamento Interno de Orden, Higiene y Seguridad',
 'Las empresas con diez o más trabajadores permanentes están obligadas a confeccionar un reglamento interno de orden, higiene y seguridad.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado 2025, en revisión final, revisado mayo 2026.', 50),

(v_uid, v_emp, 'CL', 'D.S. N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 53 — Elementos de Protección Personal',
 'El empleador debe proporcionar sin costo los elementos de protección personal adecuados al riesgo, con capacitación para su uso correcto y mantenerlos en buen estado.',
 'SI', 'Jefe HSE', 'Verificación documental y en terreno de entrega y uso de EPP en los 3 Customer Centers.', 60),

(v_uid, v_emp, 'CL', 'D.S. N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 28 — Comedor para trabajadores',
 'Cuando los trabajadores deban consumir alimentos en el sitio de trabajo, debe disponerse de un comedor aislado de las áreas de trabajo, en condiciones higiénicas adecuadas.',
 'SI', 'Gerencia de Operaciones', 'Servicio de casino externalizado (Sodexo) con programa de mantención y limpieza vigente.', 70),

(v_uid, v_emp, 'CL', 'D.S. N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 21 — Servicios higiénicos',
 'Todo lugar de trabajo debe contar con servicios higiénicos de uso individual o colectivo, con excusado y lavatorio como mínimo, separados por sexo cuando corresponda.',
 'SI', 'Gerencia de Operaciones', 'Verificado en visita a terreno para hombres y mujeres en los 3 Customer Centers, mayo 2026.', 80),

(v_uid, v_emp, 'CL', 'D.S. N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 27 — Salas de cambio',
 'Todo lugar de trabajo donde la actividad requiera cambio de ropa debe dotarse de un vestidor limpio y protegido, separado por sexo cuando corresponda.',
 'SI', 'Gerencia de Operaciones', 'Verificado en terreno mayo 2026.', 90),

(v_uid, v_emp, 'CL', 'D.S. N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 39 — Instalaciones eléctricas',
 'Las instalaciones eléctricas de los lugares de trabajo deben ser construidas, instaladas, protegidas y mantenidas de acuerdo a las normas de la autoridad competente.',
 'SI', 'Jefe HSE', 'Instalaciones adecuadas con plan de mantenimiento vigente.', 100),

-- ════════════════════════════════════════════════════════════
-- OPERACIÓN — TALLER, VEHÍCULOS Y SOLDADURA
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DFL N°1 — Ley de Tránsito (Ley N°18.290)', 'Art. 5 — Licencia de conducir',
 'Para conducir un vehículo motorizado se requiere licencia expedida por el Departamento de Tránsito y Transporte Público Municipal correspondiente.',
 'SI', 'Gerencia de Operaciones', 'Verificación de licencias vigentes de conductores, mayo 2026.', 110),

(v_uid, v_emp, 'CL', 'D.S. N°47 — Ordenanza General de Urbanismo y Construcciones', 'Art. 5.8.8 — Andamios',
 'Los andamios deben construirse con elementos sanos, ser resistentes y seguros contra desplazamientos, y para cargas pesadas o alturas mayores a 12 m usarse andamios reforzados con planos y cálculos justificativos.',
 'SI', 'Jefe HSE', 'Verificación en ejecución de trabajos en altura, mayo 2026.', 120),

(v_uid, v_emp, 'CL', 'NCh 1.466 Of. 1978 (Decreto N°256)', 'Art. 4.2 — Equipos de corte y soldadura',
 'Se debe entregar a los trabajadores únicamente equipo de soldadura adecuado y en buenas condiciones de operación, con reporte oportuno de fallas.',
 'SI', 'Jefe HSE', 'Procedimiento de trabajo con soldadura evidenciado, verificación mayo 2026.', 130),

(v_uid, v_emp, 'CL', 'DFL N°1 — Código del Trabajo', 'Art. 211-F (incorporado por Ley N°20.001)',
 'Las normas de protección de trabajadores en manipulación manual de carga y descarga se aplican cuando implican riesgo a la salud según las características de la carga.',
 'SI', 'Jefe HSE', 'Verificación documental y en instalaciones de procedimientos de manejo de carga de repuestos y componentes.', 140),

-- ════════════════════════════════════════════════════════════
-- SUSTANCIAS Y RESIDUOS PELIGROSOS
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DFL N°725 — Código Sanitario', 'Art. 80 — Autorización para residuos peligrosos',
 'Se debe contar con autorización del Servicio Nacional de Salud para la instalación y funcionamiento del lugar destinado a acumulación y disposición de residuos peligrosos (aceites usados, baterías, filtros, EPP contaminado).',
 'SI', 'Gerencia Ambiental', 'Autorización vigente para almacenamiento de residuos peligrosos de taller en los 3 Customer Centers.', 150),

(v_uid, v_emp, 'CL', 'D.S. N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 42 — Almacenamiento de sustancias peligrosas',
 'El almacenamiento de materiales (lubricantes, solventes de taller) debe realizarse por procedimientos y en lugares apropiados y seguros para los trabajadores.',
 'SI', 'Jefe HSE', 'Verificado en terreno mayo 2026.', 160),

-- ════════════════════════════════════════════════════════════
-- BRECHAS REALES DOCUMENTADAS POR EPIROC EN SU PROPIA MATRIZ
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Resolución 341 Exenta (ISP) — Guía MEHM', 'Art. único',
 'Implementación del programa preventivo de seguridad en máquinas, equipos y herramientas motrices (MEHM) según la guía del Instituto de Salud Pública.',
 'PENDIENTE', 'Jefe HSE', 'Actividades en proceso de implementación, verificación mayo 2026.', 170),

(v_uid, v_emp, 'CL', 'Resolución 1697 Exenta (MINSAL) — Protocolo TMERT v3', 'Implementación general',
 'Aplicación estandarizada del protocolo de vigilancia por exposición a factores de riesgo de trastornos musculoesqueléticos (movimientos repetitivos, posturas forzadas, manipulación de carga, vibraciones) en los puestos de taller.',
 'PENDIENTE', 'Jefe HSE', 'Protocolo en proceso de implementación.', 180),

(v_uid, v_emp, 'CL', 'DFL N°1 — Código del Trabajo', 'Art. 183-A (incorporado por Ley N°20.123)',
 'Gestión del régimen de trabajo en subcontratación: acreditación del cumplimiento de obligaciones laborales y previsionales de contratistas y subcontratistas.',
 'NO', 'Gerencia de Operaciones', NULL, 190),

(v_uid, v_emp, 'CL', 'D.S. N°76 — Gestión de SST en obras con contratistas (Art. 66 bis, Ley N°16.744)', 'Art. 3',
 'La empresa principal y sus contratistas y subcontratistas deben cumplir individualmente sus obligaciones de protección de la seguridad y salud de los trabajadores en obras, faenas o servicios compartidos.',
 'NO', 'Jefe HSE', NULL, 200);

END $$;
