-- Corregir la función de sincronización de datos de facturación
CREATE OR REPLACE FUNCTION public.sync_billing_data_to_contracts()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar todos los contratos activos del cliente con la nueva información de facturación
  UPDATE public."NEW_Contracts" 
  SET 
    billing_address = COALESCE(NEW.billing_address, "NEW_Contracts".billing_address),
    -- Solo llenar billing_entity_name si es diferente al nombre del cliente
    billing_entity_name = CASE 
      WHEN NEW.name IS NOT NULL AND NEW.name != "NEW_Contracts".client_full_name 
      THEN NEW.name 
      ELSE null 
    END,
    -- billing_entity_nif siempre viene de NEW_Billing.nif
    billing_entity_nif = NEW.nif,
    updated_at = now()
  WHERE client_id = NEW.client_id AND is_latest = true
  AND ("NEW_Contracts".billing_address IS NOT NULL OR NEW.billing_address IS NOT NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;