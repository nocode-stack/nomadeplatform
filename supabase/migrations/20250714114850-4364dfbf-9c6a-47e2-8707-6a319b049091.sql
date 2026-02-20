-- Limpiar triggers duplicados de presupuestos para evitar conflictos
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_budget ON public."NEW_Budget";
DROP TRIGGER IF EXISTS trigger_sync_budget_total_to_contracts ON public."NEW_Budget";

-- Mantener solo los triggers correctos (los sin prefijo 'trigger_')
-- El trigger ensure_single_primary_budget_trigger ya existe y funciona
-- El trigger sync_budget_total_to_contracts_trigger ya existe y funciona

-- Verificar que las funciones existen y son correctas
-- Función para asegurar solo un presupuesto primario por proyecto
CREATE OR REPLACE FUNCTION public.ensure_single_primary_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando como primario = true, desmarcar todos los otros del mismo proyecto
  IF NEW.is_primary = true THEN
    UPDATE public."NEW_Budget" 
    SET is_primary = false 
    WHERE project_id = NEW.project_id 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para sincronizar total del presupuesto primario a contratos
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
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Verificar que los triggers están creados correctamente
CREATE OR REPLACE TRIGGER ensure_single_primary_budget_trigger
  BEFORE UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_budget();

CREATE OR REPLACE TRIGGER sync_budget_total_to_contracts_trigger
  AFTER UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_budget_total_to_contracts();