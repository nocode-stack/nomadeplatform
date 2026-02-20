-- Actualizar la función de sincronización de facturación para manejar NULLs
CREATE OR REPLACE FUNCTION public.sync_billing_data_to_contracts()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar todos los contratos activos del cliente con la nueva información de facturación
  UPDATE public."NEW_Contracts" 
  SET 
    billing_address = COALESCE(NEW.billing_address, "NEW_Contracts".billing_address),
    billing_entity_name = COALESCE(NEW.name, "NEW_Contracts".billing_entity_name),
    billing_entity_nif = COALESCE(NEW.nif, "NEW_Contracts".billing_entity_nif),
    updated_at = now()
  WHERE client_id = NEW.client_id AND is_latest = true
  AND ("NEW_Contracts".billing_address IS NOT NULL OR NEW.billing_address IS NOT NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;