-- Función para sincronizar datos de cliente en contratos
CREATE OR REPLACE FUNCTION public.sync_client_data_to_contracts()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar todos los contratos activos de este cliente
  UPDATE public."NEW_Contracts" 
  SET 
    client_full_name = NEW.name,
    client_email = NEW.email,
    client_dni = NEW.dni,
    client_phone = NEW.phone,
    billing_address = COALESCE(NEW.address, billing_address),
    updated_at = now()
  WHERE client_id = NEW.id AND is_latest = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar cuando se actualiza un cliente
CREATE TRIGGER sync_client_data_trigger
  AFTER UPDATE ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_data_to_contracts();

-- Función para sincronizar datos de vehículo en contratos
CREATE OR REPLACE FUNCTION public.sync_vehicle_data_to_contracts()
RETURNS TRIGGER AS $$
DECLARE
  project_id_var UUID;
BEGIN
  -- Obtener el project_id del vehículo
  project_id_var := NEW.project_id;
  
  -- Si el vehículo tiene un proyecto asignado, actualizar sus contratos
  IF project_id_var IS NOT NULL THEN
    UPDATE public."NEW_Contracts" 
    SET 
      vehicle_vin = NEW.numero_bastidor,
      vehicle_plate = NEW.matricula,
      vehicle_engine = NEW.engine,
      vehicle_model = CONCAT_WS(' ', NEW.engine, NEW.transmission_type, NEW.plazas, 'plazas'),
      updated_at = now()
    WHERE project_id = project_id_var AND is_latest = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar cuando se actualiza un vehículo
CREATE TRIGGER sync_vehicle_data_trigger
  AFTER UPDATE ON public."NEW_Vehicles"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vehicle_data_to_contracts();