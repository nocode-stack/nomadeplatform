
-- Modificar la función para evitar duplicados al inicializar fases
CREATE OR REPLACE FUNCTION initialize_project_phases(project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insertar solo las fases que no existen para el proyecto
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
  WHERE NOT EXISTS (
    SELECT 1 FROM project_phase_progress ppp 
    WHERE ppp.project_id = project_id_param 
    AND ppp.phase_template_id = pt.id
  )
  ORDER BY pt.order_index;
END;
$function$;
