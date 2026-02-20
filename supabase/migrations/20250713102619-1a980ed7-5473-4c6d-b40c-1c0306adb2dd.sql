-- Crear función para asignación atómica de vehículos a proyectos
CREATE OR REPLACE FUNCTION public.assign_vehicle_to_project_atomic(
  p_vehicle_id UUID,
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
    
    -- Paso 1: Liberar cualquier vehículo que esté asignado a este proyecto
    UPDATE "NEW_Vehicles" 
    SET project_id = NULL 
    WHERE project_id = p_project_id;
    
    -- Paso 2: Asignar el vehículo específico al proyecto
    UPDATE "NEW_Vehicles" 
    SET project_id = p_project_id 
    WHERE id = p_vehicle_id;
    
    -- Verificar que la asignación fue exitosa
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vehicle with ID % does not exist', p_vehicle_id;
    END IF;
    
  ELSE
    -- Solo desasignar el vehículo
    UPDATE "NEW_Vehicles" 
    SET project_id = NULL 
    WHERE id = p_vehicle_id;
    
    -- Verificar que el vehículo existe
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vehicle with ID % does not exist', p_vehicle_id;
    END IF;
  END IF;
END;
$$;