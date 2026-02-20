-- Mejorar triggers de sincronización de datos de facturación para actualización instantánea

-- Función mejorada para sincronizar datos de clientes a contratos
CREATE OR REPLACE FUNCTION public.sync_client_data_to_contracts()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
    client_dni = COALESCE(NEW.dni, 'PENDIENTE'),
    client_phone = NEW.phone,
    billing_address = COALESCE(billing_data.billing_address, NEW.address, billing_address),
    billing_entity_name = CASE 
      WHEN billing_data.name IS NOT NULL AND billing_data.name != NEW.name 
      THEN billing_data.name 
      ELSE null 
    END,
    billing_entity_nif = billing_data.nif,
    updated_at = now()
  WHERE client_id = NEW.id AND is_latest = true;
  
  RETURN NEW;
END;
$function$;

-- Función mejorada para sincronizar datos de facturación a contratos
CREATE OR REPLACE FUNCTION public.sync_billing_data_to_contracts()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Actualizar todos los contratos activos del cliente con la nueva información de facturación
  UPDATE public."NEW_Contracts" 
  SET 
    billing_address = COALESCE(NEW.billing_address, "NEW_Contracts".billing_address),
    billing_entity_name = CASE 
      WHEN NEW.name IS NOT NULL AND NEW.name != "NEW_Contracts".client_full_name 
      THEN NEW.name 
      ELSE null 
    END,
    billing_entity_nif = NEW.nif,
    updated_at = now()
  WHERE client_id = NEW.client_id AND is_latest = true;
  
  RETURN NEW;
END;
$function$;

-- Recrear triggers para asegurar sincronización instantánea
DROP TRIGGER IF EXISTS sync_client_data_to_contracts_trigger ON public."NEW_Clients";
CREATE TRIGGER sync_client_data_to_contracts_trigger
  AFTER UPDATE ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_data_to_contracts();

DROP TRIGGER IF EXISTS sync_billing_data_to_contracts_trigger ON public."NEW_Billing";
CREATE TRIGGER sync_billing_data_to_contracts_trigger
  AFTER INSERT OR UPDATE ON public."NEW_Billing"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_billing_data_to_contracts();

-- También crear trigger para INSERT en clientes (por si se crean nuevos)
DROP TRIGGER IF EXISTS sync_client_data_to_contracts_insert_trigger ON public."NEW_Clients";
CREATE TRIGGER sync_client_data_to_contracts_insert_trigger
  AFTER INSERT ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_data_to_contracts();