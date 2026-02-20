-- Actualizar la función para sincronizar datos de cliente en contratos incluyendo facturación
CREATE OR REPLACE FUNCTION public.sync_client_data_to_contracts()
RETURNS TRIGGER AS $$
DECLARE
  billing_data RECORD;
BEGIN
  -- Obtener datos de facturación del cliente si existen
  SELECT * INTO billing_data 
  FROM public."NEW_Billing" 
  WHERE client_id = NEW.id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Actualizar todos los contratos activos de este cliente
  UPDATE public."NEW_Contracts" 
  SET 
    client_full_name = NEW.name,
    client_email = NEW.email,
    client_dni = NEW.dni,
    client_phone = NEW.phone,
    billing_address = COALESCE(billing_data.billing_address, NEW.address, billing_address),
    billing_entity_name = COALESCE(billing_data.name, billing_entity_name),
    billing_entity_nif = COALESCE(billing_data.nif, billing_entity_nif),
    updated_at = now()
  WHERE client_id = NEW.id AND is_latest = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para sincronizar cuando se actualiza información de facturación
CREATE OR REPLACE FUNCTION public.sync_billing_data_to_contracts()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar todos los contratos activos del cliente con la nueva información de facturación
  UPDATE public."NEW_Contracts" 
  SET 
    billing_address = NEW.billing_address,
    billing_entity_name = NEW.name,
    billing_entity_nif = NEW.nif,
    updated_at = now()
  WHERE client_id = NEW.client_id AND is_latest = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar cuando se actualiza información de facturación
CREATE TRIGGER sync_billing_data_trigger
  AFTER UPDATE ON public."NEW_Billing"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_billing_data_to_contracts();

-- Trigger para sincronizar cuando se inserta nueva información de facturación
CREATE TRIGGER sync_billing_data_insert_trigger
  AFTER INSERT ON public."NEW_Billing"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_billing_data_to_contracts();