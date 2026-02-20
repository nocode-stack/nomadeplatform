-- Crear función para asignación atómica de slots de producción a proyectos
CREATE OR REPLACE FUNCTION public.assign_slot_to_project_atomic(
  p_slot_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si se va a asignar a un proyecto específico
  IF p_project_id IS NOT NULL THEN
    -- Verificar que el proyecto existe
    IF NOT EXISTS (SELECT 1 FROM "NEW_Projects" WHERE id = p_project_id) THEN
      RAISE EXCEPTION 'Project with ID % does not exist', p_project_id;
    END IF;
    
    -- Verificar que el slot existe
    IF NOT EXISTS (SELECT 1 FROM "NEW_Production_Schedule" WHERE id = p_slot_id) THEN
      RAISE EXCEPTION 'Slot with ID % does not exist', p_slot_id;
    END IF;
    
    -- Paso 1: Liberar cualquier slot que esté asignado a este proyecto
    UPDATE "NEW_Production_Schedule" 
    SET project_id = NULL 
    WHERE project_id = p_project_id;
    
    -- Paso 2: Asignar el slot específico al proyecto
    UPDATE "NEW_Production_Schedule" 
    SET project_id = p_project_id 
    WHERE id = p_slot_id;
    
  ELSE
    -- Solo desasignar el slot
    UPDATE "NEW_Production_Schedule" 
    SET project_id = NULL 
    WHERE id = p_slot_id;
    
    -- Verificar que el slot existe
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Slot with ID % does not exist', p_slot_id;
    END IF;
  END IF;
END;
$$;