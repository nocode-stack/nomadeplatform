
-- AGREGAR COLUMNA STATUS Y ARREGLAR EL SISTEMA DE FASES
-- Paso 1: Agregar la columna status y progress a la tabla projects

-- Crear el enum para el status si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'prospect', 
            'pre_production', 
            'production', 
            'reworks', 
            'pre_delivery', 
            'delivered'
        );
    END IF;
END$$;

-- Agregar columnas status y progress a projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'prospect',
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress);

-- Ahora ejecutar la limpieza de fases (versión corregida)
-- Eliminar referencias existentes en project_phase_progress
DELETE FROM project_phase_progress;

-- Eliminar fases duplicadas manteniendo solo las originales con responsible_role
DELETE FROM phase_templates 
WHERE responsible_role IS NULL 
OR created_at > '2025-06-29 09:02:00';

-- Reorganizar order_index secuencialmente
UPDATE phase_templates SET order_index = 1 WHERE phase_group = 'prospect' AND phase_name = 'Cliente potencial registrado';
UPDATE phase_templates SET order_index = 2 WHERE phase_group = 'pre_production' AND phase_name = 'Pago y firma contrato de reserva';
UPDATE phase_templates SET order_index = 3 WHERE phase_group = 'pre_production' AND phase_name = 'Pago del 20% y firma acuerdo compraventa';
UPDATE phase_templates SET order_index = 4 WHERE phase_group = 'pre_production' AND phase_name = 'Pago del 60% y onboarding customer';
UPDATE phase_templates SET order_index = 5 WHERE phase_group = 'production' AND phase_name = 'B1';
UPDATE phase_templates SET order_index = 6 WHERE phase_group = 'production' AND phase_name = 'B2';
UPDATE phase_templates SET order_index = 7 WHERE phase_group = 'production' AND phase_name = 'B3';
UPDATE phase_templates SET order_index = 8 WHERE phase_group = 'production' AND phase_name = 'B3.2';
UPDATE phase_templates SET order_index = 9 WHERE phase_group = 'production' AND phase_name = 'B4';
UPDATE phase_templates SET order_index = 10 WHERE phase_group = 'production' AND phase_name = 'B5';
UPDATE phase_templates SET order_index = 11 WHERE phase_group = 'production' AND phase_name = 'Control de calidad';
UPDATE phase_templates SET order_index = 12 WHERE phase_group = 'reworks' AND phase_name = 'Reworks terminados';
UPDATE phase_templates SET order_index = 13 WHERE phase_group = 'reworks' AND phase_name = 'Homologación';
UPDATE phase_templates SET order_index = 14 WHERE phase_group = 'reworks' AND phase_name = 'ITV';
UPDATE phase_templates SET order_index = 15 WHERE phase_group = 'pre_delivery' AND phase_name = 'Pago del 20% final';
UPDATE phase_templates SET order_index = 16 WHERE phase_group = 'pre_delivery' AND phase_name = 'Pago del IEMDT';
UPDATE phase_templates SET order_index = 17 WHERE phase_group = 'pre_delivery' AND phase_name = 'Cambio de nombre';
UPDATE phase_templates SET order_index = 18 WHERE phase_group = 'pre_delivery' AND phase_name = 'Limpieza';
UPDATE phase_templates SET order_index = 19 WHERE phase_group = 'delivered' AND phase_name = 'Entrega realizada';

-- Actualizar descripciones para mayor claridad
UPDATE phase_templates SET description = 'Registro inicial del cliente como potencial comprador' WHERE phase_name = 'Cliente potencial registrado';
UPDATE phase_templates SET description = 'Pago inicial de 500€ y firma del contrato de reserva' WHERE phase_name = 'Pago y firma contrato de reserva';
UPDATE phase_templates SET description = 'Segundo pago (20% del total) y firma del acuerdo de compraventa' WHERE phase_name = 'Pago del 20% y firma acuerdo compraventa';
UPDATE phase_templates SET description = 'Pago del 60% del vehículo y proceso de onboarding del cliente' WHERE phase_name = 'Pago del 60% y onboarding customer';
UPDATE phase_templates SET description = 'Estructura base del vehículo' WHERE phase_name = 'B1';
UPDATE phase_templates SET description = 'Sistema eléctrico básico' WHERE phase_name = 'B2';
UPDATE phase_templates SET description = 'Carrocería y acabados exteriores' WHERE phase_name = 'B3';
UPDATE phase_templates SET description = 'Acabados interiores y tapicería' WHERE phase_name = 'B3.2';
UPDATE phase_templates SET description = 'Sistemas avanzados y electrónica' WHERE phase_name = 'B4';
UPDATE phase_templates SET description = 'Acabados finales y detalles' WHERE phase_name = 'B5';
UPDATE phase_templates SET description = 'Inspección completa de calidad antes de reworks' WHERE phase_name = 'Control de calidad';
UPDATE phase_templates SET description = 'Corrección de defectos encontrados en control de calidad' WHERE phase_name = 'Reworks terminados';
UPDATE phase_templates SET description = 'Proceso de homologación del vehículo' WHERE phase_name = 'Homologación';
UPDATE phase_templates SET description = 'Inspección técnica de vehículos' WHERE phase_name = 'ITV';
UPDATE phase_templates SET description = 'Pago final del 20% restante del vehículo' WHERE phase_name = 'Pago del 20% final';
UPDATE phase_templates SET description = 'Pago del Impuesto Especial sobre Determinados Medios de Transporte' WHERE phase_name = 'Pago del IEMDT';
UPDATE phase_templates SET description = 'Cambio de titularidad del vehículo' WHERE phase_name = 'Cambio de nombre';
UPDATE phase_templates SET description = 'Limpieza final del vehículo antes de la entrega' WHERE phase_name = 'Limpieza';
UPDATE phase_templates SET description = 'Entrega oficial del vehículo al cliente' WHERE phase_name = 'Entrega realizada';

-- Actualizar la función calculate_project_status para que también calcule el progress
CREATE OR REPLACE FUNCTION public.calculate_project_status(project_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  completed_phases TEXT[];
  project_status TEXT;
  total_phases INTEGER;
  completed_count INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Obtener grupos de fases completadas
  SELECT ARRAY_AGG(DISTINCT pt.phase_group)
  INTO completed_phases
  FROM project_phase_progress ppp
  JOIN phase_templates pt ON ppp.phase_template_id = pt.id
  WHERE ppp.project_id = project_id_param AND ppp.is_completed = true;
  
  -- Calcular progreso como porcentaje
  SELECT COUNT(*) INTO total_phases
  FROM project_phase_progress ppp
  WHERE ppp.project_id = project_id_param;
  
  SELECT COUNT(*) INTO completed_count
  FROM project_phase_progress ppp
  WHERE ppp.project_id = project_id_param AND ppp.is_completed = true;
  
  IF total_phases > 0 THEN
    progress_percentage := ROUND((completed_count::DECIMAL / total_phases::DECIMAL) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Determinar estado basado en fases completadas
  IF 'delivered' = ANY(completed_phases) THEN
    project_status := 'delivered';
  ELSIF 'pre_delivery' = ANY(completed_phases) THEN
    project_status := 'pre_delivery';
  ELSIF 'reworks' = ANY(completed_phases) THEN
    project_status := 'reworks';
  ELSIF 'production' = ANY(completed_phases) THEN
    project_status := 'production';
  ELSIF 'pre_production' = ANY(completed_phases) THEN
    project_status := 'pre_production';
  ELSE
    project_status := 'prospect';
  END IF;
  
  -- Actualizar el estado y progreso del proyecto
  UPDATE projects 
  SET status = project_status::project_status,
      progress = progress_percentage,
      updated_at = now()
  WHERE id = project_id_param;
  
  RETURN project_status;
END;
$function$;

-- Inicializar fases para todos los proyectos existentes
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM projects LOOP
        PERFORM initialize_project_phases(project_record.id);
    END LOOP;
END $$;

-- Actualizar el estado y progreso de todos los proyectos
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM projects LOOP
        PERFORM calculate_project_status(project_record.id);
    END LOOP;
END $$;

-- Crear trigger para actualizar automáticamente el estado cuando se modifiquen las fases
DROP TRIGGER IF EXISTS update_project_status_on_phase_change ON project_phase_progress;
CREATE TRIGGER update_project_status_on_phase_change
    AFTER INSERT OR UPDATE OR DELETE ON project_phase_progress
    FOR EACH ROW EXECUTE FUNCTION update_project_status_trigger();

-- Verificación final
SELECT 
    'RESUMEN FINAL' as titulo,
    COUNT(*) as total_phase_templates,
    COUNT(DISTINCT phase_group) as grupos_unicos
FROM phase_templates
UNION ALL
SELECT 
    'PROYECTOS CON FASES',
    COUNT(DISTINCT project_id),
    0
FROM project_phase_progress
UNION ALL
SELECT 
    'TOTAL ASIGNACIONES FASES',
    COUNT(*),
    0
FROM project_phase_progress
UNION ALL
SELECT 
    'PROYECTOS CON STATUS',
    COUNT(*),
    0
FROM projects WHERE status IS NOT NULL;
