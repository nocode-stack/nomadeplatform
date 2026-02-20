-- Mejorar el trigger para sincronizar datos de vehículo con contratos
-- incluyendo cuando se asigna un vehículo a un proyecto
CREATE OR REPLACE FUNCTION public.sync_vehicle_project_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si se asigna un proyecto a un vehículo, actualizar los contratos de ese proyecto
  IF NEW.project_id IS NOT NULL AND (OLD.project_id IS NULL OR OLD.project_id != NEW.project_id) THEN
    UPDATE public."NEW_Contracts" 
    SET 
      vehicle_vin = NEW.numero_bastidor,
      vehicle_plate = NEW.matricula,
      vehicle_engine = NEW.engine,
      vehicle_model = CONCAT_WS(' ', 
        COALESCE(NEW.engine, ''), 
        COALESCE(NEW.transmission_type, ''), 
        CASE WHEN NEW.plazas IS NOT NULL THEN NEW.plazas || ' plazas' ELSE '' END
      ),
      updated_at = now()
    WHERE project_id = NEW.project_id AND is_latest = true;
  END IF;
  
  -- Si se cambia el proyecto asignado, actualizar tanto el nuevo como el anterior
  IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
    -- Limpiar contratos del proyecto anterior
    IF OLD.project_id IS NOT NULL THEN
      UPDATE public."NEW_Contracts" 
      SET 
        vehicle_vin = NULL,
        vehicle_plate = NULL,
        vehicle_engine = NULL,
        vehicle_model = 'Modelo pendiente',
        updated_at = now()
      WHERE project_id = OLD.project_id AND is_latest = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS sync_vehicle_data_to_contracts_trigger ON public."NEW_Vehicles";

-- Crear nuevo trigger
CREATE TRIGGER sync_vehicle_project_assignment_trigger
  AFTER UPDATE ON public."NEW_Vehicles"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vehicle_project_assignment();