
-- Agregar relación de vehículo asignado al proyecto
ALTER TABLE public.projects 
ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Crear índice para mejor rendimiento
CREATE INDEX idx_projects_vehicle_id ON public.projects(vehicle_id);

-- Actualizar el trigger para mantener sincronización bidireccional
CREATE OR REPLACE FUNCTION public.sync_project_vehicle_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se asigna un vehículo al proyecto
  IF NEW.vehicle_id IS NOT NULL AND (OLD.vehicle_id IS NULL OR OLD.vehicle_id != NEW.vehicle_id) THEN
    -- Actualizar el vehículo para que apunte a este proyecto
    UPDATE public.vehicles 
    SET project_id = NEW.id 
    WHERE id = NEW.vehicle_id;
    
    -- Liberar el vehículo anterior si había uno
    IF OLD.vehicle_id IS NOT NULL THEN
      UPDATE public.vehicles 
      SET project_id = NULL 
      WHERE id = OLD.vehicle_id;
    END IF;
  END IF;
  
  -- Si se desasigna el vehículo del proyecto
  IF NEW.vehicle_id IS NULL AND OLD.vehicle_id IS NOT NULL THEN
    UPDATE public.vehicles 
    SET project_id = NULL 
    WHERE id = OLD.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para sincronizar la asignación
CREATE TRIGGER sync_project_vehicle_assignment_trigger
  AFTER UPDATE OF vehicle_id ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_vehicle_assignment();
