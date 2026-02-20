-- Ejecutar manualmente la función de actualización de estado para este proyecto específico
DO $$
DECLARE
  completed_phases TEXT[];
  project_status TEXT;
  project_id_param UUID := 'fcb3027b-84c9-4bc6-a3e3-32f05e775aa0';
BEGIN
  -- Get completed phase groups
  SELECT ARRAY_AGG(DISTINCT pt."group")
  INTO completed_phases
  FROM public."NEW_Project_Phase_Progress" ppp
  JOIN public."NEW_Project_Phase_Template" pt ON ppp.phase_template_id = pt.id
  WHERE ppp.project_id = project_id_param 
    AND ppp.status = 'completed';
  
  -- Determine project status based on completed phase groups
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
  
  -- Update project status
  UPDATE public."NEW_Projects" 
  SET 
    status = project_status,
    updated_at = now()
  WHERE id = project_id_param;
  
  -- Log the result
  RAISE NOTICE 'Proyecto % actualizado de estado prospect a %', project_id_param, project_status;
  RAISE NOTICE 'Grupos completados: %', completed_phases;
END $$;