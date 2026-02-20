-- Recrear los triggers de sincronización de contratos que se perdieron

-- 1. Función para sincronizar datos del cliente a contratos
CREATE OR REPLACE FUNCTION public.sync_client_data_to_contracts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
$$;

-- 2. Función para sincronizar datos de facturación a contratos
CREATE OR REPLACE FUNCTION public.sync_billing_data_to_contracts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
$$;

-- 3. Crear triggers para NEW_Clients
DROP TRIGGER IF EXISTS sync_client_data_to_contracts_trigger ON public."NEW_Clients";
CREATE TRIGGER sync_client_data_to_contracts_trigger
  AFTER UPDATE ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_data_to_contracts();

DROP TRIGGER IF EXISTS sync_client_data_to_contracts_insert_trigger ON public."NEW_Clients";
CREATE TRIGGER sync_client_data_to_contracts_insert_trigger
  AFTER INSERT ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_data_to_contracts();

-- 4. Crear triggers para NEW_Billing
DROP TRIGGER IF EXISTS sync_billing_data_to_contracts_trigger ON public."NEW_Billing";
CREATE TRIGGER sync_billing_data_to_contracts_trigger
  AFTER INSERT OR UPDATE ON public."NEW_Billing"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_billing_data_to_contracts();

-- 5. Verificar y mejorar trigger de sincronización de presupuesto a contratos
CREATE OR REPLACE FUNCTION public.sync_budget_total_to_contracts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  primary_budget_total NUMERIC;
BEGIN
  -- Si el presupuesto se marca como primario o se actualiza su total
  IF (TG_OP = 'UPDATE' AND (NEW.is_primary = true OR OLD.total != NEW.total)) OR 
     (TG_OP = 'INSERT' AND NEW.is_primary = true) THEN
    
    -- Si se está marcando como primario, primero desmarcar otros
    IF NEW.is_primary = true THEN
      UPDATE public."NEW_Budget" 
      SET is_primary = false 
      WHERE project_id = NEW.project_id 
        AND id != NEW.id;
    END IF;
    
    -- Obtener el total del presupuesto primario
    SELECT total INTO primary_budget_total
    FROM public."NEW_Budget"
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
      AND is_primary = true;
    
    -- Actualizar todos los contratos activos del proyecto con el total del presupuesto primario
    IF primary_budget_total IS NOT NULL THEN
      UPDATE public."NEW_Contracts"
      SET 
        total_price = primary_budget_total,
        updated_at = now()
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND is_latest = true
        AND is_active = true;
        
      RAISE NOTICE 'Contratos actualizados con total del presupuesto primario: % para proyecto: %', 
        primary_budget_total, COALESCE(NEW.project_id, OLD.project_id);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Recrear trigger de presupuesto
DROP TRIGGER IF EXISTS sync_budget_total_to_contracts_trigger ON public."NEW_Budget";
CREATE TRIGGER sync_budget_total_to_contracts_trigger
  AFTER INSERT OR UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_budget_total_to_contracts();