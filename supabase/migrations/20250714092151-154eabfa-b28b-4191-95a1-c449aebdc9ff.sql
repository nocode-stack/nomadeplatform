-- Check what triggers exist and fix the budget calculation trigger

-- First, let's see what triggers are currently on the NEW_Budget table
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'NEW_Budget';

-- Drop any existing budget calculation triggers that might be misconfigured
DROP TRIGGER IF EXISTS calculate_budget_totals_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS calculate_new_budget_totals_trigger ON public."NEW_Budget";
DROP TRIGGER IF EXISTS update_budget_totals_trigger ON public."NEW_Budget";

-- Create the correct trigger on NEW_Budget_Items table (not NEW_Budget)
DROP TRIGGER IF EXISTS calculate_new_budget_totals_trigger ON public."NEW_Budget_Items";

CREATE TRIGGER calculate_new_budget_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_new_budget_totals();