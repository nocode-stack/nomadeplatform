-- Crear función para sincronizar el total del presupuesto primario con los contratos
CREATE OR REPLACE FUNCTION public.sync_budget_total_to_contracts()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
$function$;

-- Crear trigger para cuando se actualiza un presupuesto
CREATE OR REPLACE TRIGGER trigger_sync_budget_total_to_contracts
  AFTER INSERT OR UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_budget_total_to_contracts();

-- Sincronizar totales existentes
UPDATE public."NEW_Contracts" 
SET total_price = (
  SELECT b.total 
  FROM public."NEW_Budget" b 
  WHERE b.project_id = "NEW_Contracts".project_id 
    AND b.is_primary = true
)
WHERE is_latest = true 
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM public."NEW_Budget" b 
    WHERE b.project_id = "NEW_Contracts".project_id 
      AND b.is_primary = true
  );