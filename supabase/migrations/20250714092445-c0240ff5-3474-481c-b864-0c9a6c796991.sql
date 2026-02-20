-- Verificar y corregir todos los triggers relacionados con presupuestos

-- Primero, ver qué triggers existen exactamente
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT trigger_name, event_object_table, action_timing, event_manipulation
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
          AND (trigger_name LIKE '%budget%' OR event_object_table LIKE '%Budget%')
    LOOP
        RAISE NOTICE 'Trigger: % on table: % - % %', 
            trigger_rec.trigger_name, 
            trigger_rec.event_object_table,
            trigger_rec.action_timing,
            trigger_rec.event_manipulation;
    END LOOP;
END $$;

-- Eliminar TODOS los triggers problemáticos de presupuestos
DROP TRIGGER IF EXISTS calculate_new_budget_totals_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS calculate_budget_totals_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS update_budget_totals_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS ensure_single_primary_budget_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS sync_budget_total_to_contracts_trigger ON public."NEW_Budget";

-- También limpiar triggers en NEW_Budget_Items por si acaso
DROP TRIGGER IF EXISTS calculate_new_budget_totals_trigger ON public."NEW_Budget_Items";

-- Crear SOLO el trigger correcto en NEW_Budget_Items para recálculo de totales
CREATE TRIGGER calculate_new_budget_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_new_budget_totals();

-- Recrear el trigger para un solo presupuesto primario
CREATE TRIGGER ensure_single_primary_budget_trigger
  BEFORE UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_budget();

-- Recrear el trigger para sincronizar totales a contratos
CREATE TRIGGER sync_budget_total_to_contracts_trigger
  AFTER UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_budget_total_to_contracts();