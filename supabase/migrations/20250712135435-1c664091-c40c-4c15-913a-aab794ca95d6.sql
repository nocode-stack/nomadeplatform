-- Migración para vincular proyectos existentes de NEW_Projects con las nuevas fases
-- Esta función procesará todos los proyectos en NEW_Projects y les asignará fases automáticamente

DO $$
DECLARE
    project_record RECORD;
    phase_count INTEGER;
BEGIN
    -- Recorrer todos los proyectos en NEW_Projects
    FOR project_record IN 
        SELECT id, project_code, name 
        FROM "NEW_Projects"
    LOOP
        -- Verificar si ya tiene fases asignadas
        SELECT COUNT(*) INTO phase_count
        FROM "NEW_Project_Phase_Progress"
        WHERE project_id = project_record.id;
        
        -- Si no tiene fases, inicializarlas
        IF phase_count = 0 THEN
            RAISE NOTICE 'Inicializando fases para proyecto: % (ID: %)', project_record.project_code, project_record.id;
            
            -- Llamar a la función para inicializar fases
            PERFORM initialize_new_project_phases(project_record.id);
        ELSE
            RAISE NOTICE 'Proyecto % ya tiene % fases asignadas', project_record.project_code, phase_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migración de fases completada. Todos los proyectos ahora tienen fases asignadas.';
END $$;