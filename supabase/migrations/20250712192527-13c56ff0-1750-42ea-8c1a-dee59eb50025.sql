-- Corregir la función de sincronización de datos de cliente
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
    -- Solo llenar billing_entity_name si es diferente al nombre del cliente
    billing_entity_name = CASE 
      WHEN billing_data.name IS NOT NULL AND billing_data.name != NEW.name 
      THEN billing_data.name 
      ELSE null 
    END,
    -- billing_entity_nif siempre viene de NEW_Billing.nif
    billing_entity_nif = billing_data.nif,
    updated_at = now()
  WHERE client_id = NEW.id AND is_latest = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;