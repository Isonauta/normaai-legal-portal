-- demo-data-camanchaca.sql
-- Datos demo para Camanchaca — pesca extractiva, acuicultura (salmón y
-- mitílidos) y plantas de proceso/congelado para exportación
--
-- INSTRUCCIONES:
--   1. En /admin → Clientes → "Crear cliente": crea demo@camanchaca.cl
--      (nombre: Camanchaca Demo, empresa: Camanchaca, clave: Camanchaca).
--      Esto crea el usuario en auth.users Y la fila en normaai_clientes en
--      un solo paso ya validado por la app — no lo reemplaces por un
--      INSERT manual.
--   2. Inicia sesión como demo@camanchaca.cl y completa el onboarding
--      guiado con estos valores (para que el asistente NormaAI quede
--      enfocado en los procesos reales de Camanchaca):
--        · Rubro: Pesca extractiva, acuicultura (salmón y mitílidos) y
--          procesamiento/congelado de productos del mar para exportación
--        · Normas ISO: 9001, 14001, 45001
--        · Sitios de trabajo: Planta de proceso Puerto Montt · Centros de
--          cultivo Región de Los Lagos y Aysén · Flota pesquera Región del
--          Biobío
--   3. Copia el UUID del usuario desde auth.users y reemplaza
--      DEMO_USER_ID_AQUI abajo. Ejecuta este script en Supabase → SQL
--      Editor para cargar los requisitos de ejemplo.
--
-- Nota: el rubro está tomado de información pública sobre Camanchaca
-- (pesca, salmonicultura, mitílidos, plantas de proceso). Si Camanchaca
-- precisa enfocar la demo en una sola línea de negocio (p. ej. solo
-- salmonicultura) antes de la reunión, ajustar el onboarding y este
-- script.

DO $$
DECLARE
  v_uid UUID := 'DEMO_USER_ID_AQUI'::UUID;  -- <- REEMPLAZAR
  v_emp TEXT := 'Camanchaca';
BEGIN

-- ════════════════════════════════════════════════════════════
-- CHILE — Ley General de Pesca y Acuicultura (Ley 18.892) y Ley 20.657
-- ════════════════════════════════════════════════════════════
INSERT INTO normaai_requisitos (user_id, empresa, pais, cuerpo_legal, articulo, descripcion, cumple, responsable, forma_cumplimiento, orden) VALUES
(v_uid, v_emp, 'CL', 'Ley General de Pesca y Acuicultura (Ley 18.892)', 'Título VI — Concesiones y autorizaciones de acuicultura',
 'Los centros de cultivo de salmón y mitílidos deben operar con concesión de acuicultura vigente y ajustarse a la capacidad productiva autorizada por SERNAPESCA/Subpesca.',
 'SI', 'Gerencia de Acuicultura', 'Concesiones vigentes en Los Lagos y Aysén, con informes de producción presentados en plazo.', 10),

(v_uid, v_emp, 'CL', 'Ley 20.657 — Modificación Ley de Pesca', 'Cuotas globales y vedas',
 'La flota pesquera debe operar dentro de las cuotas de captura asignadas y respetar los períodos de veda biológica y extractiva vigentes.',
 'SI', 'Gerencia de Flota', 'Reporte de desembarque electrónico y monitoreo satelital de naves conforme a cuota asignada.', 20),

(v_uid, v_emp, 'CL', 'Reglamento de Trazabilidad de Productos Pesqueros y Acuícolas — SERNAPESCA', 'Res. Ex. sobre trazabilidad',
 'Trazabilidad completa desde el centro de cultivo o captura hasta el producto final exportado, con certificados de movimiento de peces vivos y guías de despacho.',
 'PENDIENTE', 'Gerencia de Calidad', 'Sistema de trazabilidad implementado en salmonicultura; falta integrar la línea de mitílidos al mismo software.', 30),

-- ════════════════════════════════════════════════════════════
-- CHILE — Sanidad acuícola — DS N°319 y Programa Sanitario Específico
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'DS N°319 — Reglamento de Medidas de Protección, Control y Erradicación de Enfermedades de Alto Riesgo', 'Art. 5° — Vigilancia sanitaria',
 'Vigilancia activa de enfermedades de alto riesgo (ISA, Caligidosis) en centros de cultivo de salmón, con reporte obligatorio a SERNAPESCA.',
 'SI', 'Jefe de Sanidad Acuícola', 'Programa de vigilancia activa vigente; reportes mensuales enviados sin observaciones.', 40),

(v_uid, v_emp, 'CL', 'Programa Sanitario Específico de Vigilancia y Control de Caligidosis (PSEVC)', 'Umbrales de carga parasitaria',
 'Mantener la carga de caligus bajo el umbral máximo permitido por barrio sanitario, con tratamientos oportunos y reporte de eficacia.',
 'NO', 'Jefe de Sanidad Acuícola', NULL, 50),

(v_uid, v_emp, 'CL', 'DS N°319', 'Art. 12° — Uso de antimicrobianos y antiparasitarios',
 'Registro y reporte a SERNAPESCA del uso de antimicrobianos y antiparasitarios por centro de cultivo, dentro de los límites autorizados.',
 'NO', 'Jefe de Sanidad Acuícola', NULL, 60),

-- ════════════════════════════════════════════════════════════
-- CHILE — Medio ambiente — Ley 19.300, RAMA, DS N°90, RETC
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 19.300 — Bases Generales del Medio Ambiente', 'RCA vigente de centros de cultivo y planta de proceso',
 'La operación de centros de cultivo y de la planta de proceso debe ajustarse a las condiciones y compromisos ambientales de su Resolución de Calificación Ambiental.',
 'SI', 'Gerencia Ambiental', 'Seguimiento de RCA con reporte semestral a la Superintendencia del Medio Ambiente.', 70),

(v_uid, v_emp, 'CL', 'RAMA — Reglamento Ambiental para la Acuicultura (DS N°320)', 'Informe Ambiental (INFA) y monitoreo bentónico',
 'Monitoreo periódico de las condiciones ambientales bajo las balsas jaula (aeróbico/anaeróbico) y presentación de Informes Ambientales según categoría de la concesión.',
 'PENDIENTE', 'Gerencia Ambiental', 'Monitoreo bentónico 2025 en terreno; informe consolidado en elaboración para dos centros de Los Lagos.', 80),

(v_uid, v_emp, 'CL', 'DS N°90 — Norma de Emisión para Descarga de Residuos Líquidos', 'Descargas de la planta de proceso',
 'Los efluentes de la planta de proceso y congelado deben cumplir los límites máximos permitidos antes de su descarga a cuerpos receptores o alcantarillado.',
 'SI', 'Gerencia Ambiental', 'Monitoreo trimestral de RILes dentro de norma, reportado a la SMA.', 90),

(v_uid, v_emp, 'CL', 'RETC — Registro de Emisiones y Transferencia de Contaminantes', 'DS N°1 (MMA)',
 'Declaración anual de residuos industriales (descartes de proceso, envases, residuos peligrosos) generados en planta de proceso y centros de cultivo.',
 'NO', 'Gerencia Ambiental', NULL, 100),

-- ════════════════════════════════════════════════════════════
-- CHILE — Inocuidad alimentaria y exportación — RSA, SERNAPESCA
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Reglamento Sanitario de los Alimentos (DS N°977)', 'Título V — Higiene en establecimientos de alimentos',
 'La planta de proceso y congelado debe mantener condiciones higiénico-sanitarias y programas de limpieza y desinfección validados.',
 'SI', 'Gerencia de Calidad', 'Plan HACCP vigente, auditado internamente sin no conformidades mayores.', 110),

(v_uid, v_emp, 'CL', 'Certificación sanitaria de plantas exportadoras — SERNAPESCA', 'Habilitación para mercados de exportación (UE, EE.UU., Asia)',
 'Mantener la habilitación sanitaria vigente de la planta para exportar a cada mercado de destino, según los requisitos específicos de cada autoridad sanitaria.',
 'SI', 'Gerencia de Calidad', 'Planta habilitada y auditada por SERNAPESCA para UE y EE.UU.; próxima auditoría de renovación agendada.', 120),

-- ════════════════════════════════════════════════════════════
-- CHILE — Seguridad y salud laboral — Ley 16.744, DS N°594, DIRECTEMAR
-- ════════════════════════════════════════════════════════════
(v_uid, v_emp, 'CL', 'Ley 16.744 — Seguridad y Salud Laboral', 'Art. 67° — Reglamento Interno de Higiene y Seguridad',
 'El RIOHS debe incluir procedimientos específicos para faenas de buceo, manejo de jaulas, y trabajo a bordo de embarcaciones pesqueras.',
 'SI', 'Gerencia RRHH', 'RIOHS actualizado y enviado a mutualidad, con anexos específicos para acuicultura y flota.', 130),

(v_uid, v_emp, 'CL', 'DS N°594 — Condiciones Sanitarias y Ambientales Básicas en Lugares de Trabajo', 'Art. 53° — Exposición ocupacional en cámaras de frío y planta de proceso',
 'Control de exposición ocupacional al frío, ruido y superficies húmedas en la planta de proceso y congelado.',
 'PENDIENTE', 'Jefe HSE', 'Monitoreo de higiene industrial programado para el próximo trimestre en línea de congelado.', 140),

(v_uid, v_emp, 'CL', 'Reglamento de Trabajo a Bordo — DIRECTEMAR / Código del Trabajo', 'Jornada y descanso de tripulantes',
 'Cumplimiento de jornadas de embarque, descanso y condiciones de habitabilidad para tripulantes de naves pesqueras y de servicio a centros de cultivo.',
 'NO', 'Gerencia de Flota', NULL, 150);

END $$;
