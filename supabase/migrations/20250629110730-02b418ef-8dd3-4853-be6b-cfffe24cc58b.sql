
-- Agregar campo para controlar el modo manual en la tabla projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS manual_status_control boolean DEFAULT false;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_projects_manual_status_control ON projects(manual_status_control);

-- Actualizar la función calculate_project_status para respetar el modo manual
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
  is_manual_control BOOLEAN;
BEGIN
  -- Verificar si el proyecto está en modo manual
  SELECT manual_status_control INTO is_manual_control
  FROM projects 
  WHERE id = project_id_param;
  
  -- Si está en modo manual, no actualizar el estado automáticamente
  IF is_manual_control THEN
    RETURN (SELECT status::text FROM projects WHERE id = project_id_param);
  END IF;
  
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
