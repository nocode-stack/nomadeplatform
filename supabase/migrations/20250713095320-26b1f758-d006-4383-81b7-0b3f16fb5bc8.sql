-- 1. LIMPIAR DATOS INCONSISTENTES
-- Sincronizar slot de producción con el proyecto de Berta
UPDATE "NEW_Production_Schedule" 
SET project_id = '82618229-82c3-47ec-a69c-e15f6b306756'
WHERE id = '6c9451ea-8db7-4a3f-80bb-d7cc9a67a062' 
AND project_id IS NULL;

-- 2. TRIGGER PARA SINCRONIZACIÓN BIDIRECCIONAL: NEW_Projects -> NEW_Production_Schedule
CREATE OR REPLACE FUNCTION sync_project_slot_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se asigna un slot al proyecto
  IF NEW.slot_id IS NOT NULL AND (OLD.slot_id IS NULL OR OLD.slot_id != NEW.slot_id) THEN
    -- Liberar slot anterior si existía
    IF OLD.slot_id IS NOT NULL THEN
      UPDATE "NEW_Production_Schedule" 
      SET project_id = NULL 
      WHERE id = OLD.slot_id;
    END IF;
    
    -- Asignar nuevo slot
    UPDATE "NEW_Production_Schedule" 
    SET project_id = NEW.id 
    WHERE id = NEW.slot_id;
  END IF;
  
  -- Si se desasigna el slot del proyecto
  IF NEW.slot_id IS NULL AND OLD.slot_id IS NOT NULL THEN
    UPDATE "NEW_Production_Schedule" 
    SET project_id = NULL 
    WHERE id = OLD.slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER PARA SINCRONIZACIÓN BIDIRECCIONAL: NEW_Production_Schedule -> NEW_Projects
CREATE OR REPLACE FUNCTION sync_slot_project_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se asigna un proyecto al slot
  IF NEW.project_id IS NOT NULL AND (OLD.project_id IS NULL OR OLD.project_id != NEW.project_id) THEN
    -- Actualizar el proyecto para que apunte a este slot
    UPDATE "NEW_Projects" 
    SET slot_id = NEW.id 
    WHERE id = NEW.project_id;
    
    -- Liberar proyecto anterior si había uno
    IF OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
      UPDATE "NEW_Projects" 
      SET slot_id = NULL 
      WHERE id = OLD.project_id;
    END IF;
  END IF;
  
  -- Si se desasigna el proyecto del slot
  IF NEW.project_id IS NULL AND OLD.project_id IS NOT NULL THEN
    UPDATE "NEW_Projects" 
    SET slot_id = NULL 
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER PARA SINCRONIZACIÓN BIDIRECCIONAL: NEW_Projects -> NEW_Vehicles
CREATE OR REPLACE FUNCTION sync_project_vehicle_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se asigna un vehículo al proyecto
  IF NEW.vehicle_id IS NOT NULL AND (OLD.vehicle_id IS NULL OR OLD.vehicle_id != NEW.vehicle_id) THEN
    -- Liberar vehículo anterior si existía
    IF OLD.vehicle_id IS NOT NULL THEN
      UPDATE "NEW_Vehicles" 
      SET project_id = NULL 
      WHERE id = OLD.vehicle_id;
    END IF;
    
    -- Asignar nuevo vehículo
    UPDATE "NEW_Vehicles" 
    SET project_id = NEW.id 
    WHERE id = NEW.vehicle_id;
  END IF;
  
  -- Si se desasigna el vehículo del proyecto
  IF NEW.vehicle_id IS NULL AND OLD.vehicle_id IS NOT NULL THEN
    UPDATE "NEW_Vehicles" 
    SET project_id = NULL 
    WHERE id = OLD.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA SINCRONIZACIÓN BIDIRECCIONAL: NEW_Vehicles -> NEW_Projects
CREATE OR REPLACE FUNCTION sync_vehicle_project_assignment_new()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se asigna un proyecto al vehículo
  IF NEW.project_id IS NOT NULL AND (OLD.project_id IS NULL OR OLD.project_id != NEW.project_id) THEN
    -- Actualizar el proyecto para que apunte a este vehículo
    UPDATE "NEW_Projects" 
    SET vehicle_id = NEW.id 
    WHERE id = NEW.project_id;
    
    -- Liberar proyecto anterior si había uno
    IF OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
      UPDATE "NEW_Projects" 
      SET vehicle_id = NULL 
      WHERE id = OLD.project_id;
    END IF;
  END IF;
  
  -- Si se desasigna el proyecto del vehículo
  IF NEW.project_id IS NULL AND OLD.project_id IS NOT NULL THEN
    UPDATE "NEW_Projects" 
    SET vehicle_id = NULL 
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR LOS TRIGGERS EN LAS TABLAS
CREATE TRIGGER trigger_sync_project_slot_assignment
  AFTER UPDATE OR INSERT ON "NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_slot_assignment();

CREATE TRIGGER trigger_sync_slot_project_assignment
  AFTER UPDATE OR INSERT ON "NEW_Production_Schedule"
  FOR EACH ROW
  EXECUTE FUNCTION sync_slot_project_assignment();

CREATE TRIGGER trigger_sync_project_vehicle_assignment
  AFTER UPDATE OR INSERT ON "NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_vehicle_assignment();

CREATE TRIGGER trigger_sync_vehicle_project_assignment_new
  AFTER UPDATE OR INSERT ON "NEW_Vehicles"
  FOR EACH ROW
  EXECUTE FUNCTION sync_vehicle_project_assignment_new();