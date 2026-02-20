
-- Modificar la función de inicialización de fases para marcar la primera fase como completada
CREATE OR REPLACE FUNCTION initialize_project_phases(project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insertar todas las fases plantilla para el proyecto
  INSERT INTO project_phase_progress (project_id, phase_template_id, is_completed, completed_at)
  SELECT 
    project_id_param, 
    pt.id,
    CASE 
      -- Marcar como completada la primera fase (Cliente potencial registrado)
      WHEN pt.phase_group = 'prospect' AND pt.phase_name = 'Cliente potencial registrado' THEN true
      ELSE false
    END,
    CASE 
      -- Establecer fecha de completado para la primera fase
      WHEN pt.phase_group = 'prospect' AND pt.phase_name = 'Cliente potencial registrado' THEN now()
      ELSE null
    END
  FROM phase_templates pt
  ORDER BY pt.order_index;
END;
$function$;

-- Recalcular las fases para proyectos existentes que solo tengan la fase de prospect sin completar
UPDATE project_phase_progress 
SET is_completed = true, completed_at = now()
WHERE phase_template_id IN (
  SELECT id FROM phase_templates 
  WHERE phase_group = 'prospect' 
  AND phase_name = 'Cliente potencial registrado'
)
AND is_completed = false;

-- Recalcular el estado de todos los proyectos para reflejar los cambios
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id FROM projects LOOP
    PERFORM calculate_project_status(project_record.id);
  END LOOP;
END $$;
