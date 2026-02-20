-- Solución definitiva al problema del budget_id
-- Eliminar TODOS los triggers problemáticos que ejecutan calculate_new_budget_totals() desde NEW_Budget

-- Ver qué triggers están actualmente en NEW_Budget
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT trigger_name, event_object_table, action_timing, event_manipulation, action_statement
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
          AND event_object_table = 'NEW_Budget'
    LOOP
        RAISE NOTICE 'NEW_Budget Trigger: % - % % - %', 
            trigger_rec.trigger_name, 
            trigger_rec.action_timing,
            trigger_rec.event_manipulation,
            trigger_rec.action_statement;
    END LOOP;
END $$;

-- ELIMINAR todos los triggers problemáticos en NEW_Budget que ejecutan calculate_new_budget_totals
DROP TRIGGER IF EXISTS trigger_calculate_new_budget_totals_budget_update ON public."NEW_Budget";
DROP TRIGGER IF EXISTS calculate_new_budget_totals_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS calculate_budget_totals_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS update_budget_totals_trigger ON public."NEW_Budget";

-- MANTENER solo los triggers correctos en NEW_Budget (recrearlos por si no existen)
-- Trigger para un solo presupuesto primario
DROP TRIGGER IF EXISTS ensure_single_primary_budget_trigger ON public."NEW_Budget";
CREATE TRIGGER ensure_single_primary_budget_trigger
  BEFORE UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_budget();

-- Trigger para sincronizar totales a contratos
DROP TRIGGER IF EXISTS sync_budget_total_to_contracts_trigger ON public."NEW_Budget";
CREATE TRIGGER sync_budget_total_to_contracts_trigger
  AFTER UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_budget_total_to_contracts();

-- Trigger para generar código de presupuesto
DROP TRIGGER IF EXISTS set_budget_code_trigger ON public."NEW_Budget";
CREATE TRIGGER set_budget_code_trigger
  BEFORE INSERT ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_budget_code();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_new_budget_updated_at ON public."NEW_Budget";
CREATE TRIGGER trigger_update_new_budget_updated_at
  BEFORE UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- VERIFICAR Y LIMPIAR triggers en NEW_Budget_Items
-- Eliminar triggers duplicados
DROP TRIGGER IF EXISTS calculate_new_budget_totals_trigger ON public."NEW_Budget_Items";
DROP TRIGGER IF EXISTS trigger_calculate_new_budget_totals_insert ON public."NEW_Budget_Items";
DROP TRIGGER IF EXISTS trigger_calculate_new_budget_totals_update ON public."NEW_Budget_Items";
DROP TRIGGER IF EXISTS trigger_calculate_new_budget_totals_delete ON public."NEW_Budget_Items";

-- Crear SOLO el trigger principal correcto en NEW_Budget_Items
CREATE TRIGGER calculate_new_budget_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_new_budget_totals();

-- Crear trigger para updated_at en NEW_Budget_Items
DROP TRIGGER IF EXISTS trigger_update_new_budget_items_updated_at ON public."NEW_Budget_Items";
CREATE TRIGGER trigger_update_new_budget_items_updated_at
  BEFORE UPDATE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verificar configuración final
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    RAISE NOTICE '=== CONFIGURACIÓN FINAL DE TRIGGERS ===';
    RAISE NOTICE 'Triggers en NEW_Budget:';
    FOR trigger_rec IN 
        SELECT trigger_name, action_timing, event_manipulation
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
          AND event_object_table = 'NEW_Budget'
        ORDER BY trigger_name
    LOOP
        RAISE NOTICE '  - %: % %', 
            trigger_rec.trigger_name, 
            trigger_rec.action_timing,
            trigger_rec.event_manipulation;
    END LOOP;
    
    RAISE NOTICE 'Triggers en NEW_Budget_Items:';
    FOR trigger_rec IN 
        SELECT trigger_name, action_timing, event_manipulation
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
          AND event_object_table = 'NEW_Budget_Items'
        ORDER BY trigger_name
    LOOP
        RAISE NOTICE '  - %: % %', 
            trigger_rec.trigger_name, 
            trigger_rec.action_timing,
            trigger_rec.event_manipulation;
    END LOOP;
END $$;