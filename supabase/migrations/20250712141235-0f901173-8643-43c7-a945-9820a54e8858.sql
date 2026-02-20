-- Inicializar fases para proyectos existentes que no las tengan
DO $$
DECLARE
  project_record RECORD;
  existing_phases_count integer;
BEGIN
  -- Iterar sobre todos los proyectos existentes
  FOR project_record IN 
    SELECT id FROM public."NEW_Projects"
  LOOP
    -- Verificar si el proyecto ya tiene fases
    SELECT COUNT(*) INTO existing_phases_count
    FROM public."NEW_Project_Phase_Progress"
    WHERE project_id = project_record.id;
    
    -- Si no tiene fases, inicializarlas
    IF existing_phases_count = 0 THEN
      PERFORM initialize_new_project_phases(project_record.id);
      RAISE NOTICE 'Fases inicializadas para proyecto existente: %', project_record.id;
    ELSE
      RAISE NOTICE 'Proyecto % ya tiene % fases', project_record.id, existing_phases_count;
    END IF;
  END LOOP;
END $$;