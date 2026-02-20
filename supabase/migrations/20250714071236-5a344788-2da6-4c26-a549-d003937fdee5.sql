-- Arreglar la función para incluir también los precios base del presupuesto
DROP FUNCTION IF EXISTS public.calculate_new_budget_totals() CASCADE;

CREATE OR REPLACE FUNCTION public.calculate_new_budget_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  budget_subtotal NUMERIC(10,2);
  budget_discount_amount NUMERIC(10,2);
  budget_iva_amount NUMERIC(10,2);
  budget_total NUMERIC(10,2);
  iva_rate NUMERIC(4,2);
  base_components_total NUMERIC(10,2);
  items_total NUMERIC(10,2);
BEGIN
  -- Obtener los datos base del presupuesto y la tasa de IVA
  SELECT 
    b.iva_rate,
    COALESCE(b.base_price, 0) + COALESCE(b.pack_price, 0) + COALESCE(b.electric_system_price, 0) + COALESCE(b.color_modifier, 0)
  INTO iva_rate, base_components_total
  FROM public."NEW_Budget" b
  WHERE b.id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Si no hay tasa de IVA, usar 21% por defecto
  IF iva_rate IS NULL THEN
    iva_rate := 21.00;
  END IF;
  
  -- Calcular total de items (solo items normales, no descuentos)
  SELECT COALESCE(SUM(line_total), 0)
  INTO items_total
  FROM public."NEW_Budget_Items"
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
    AND is_discount = false;
  
  -- Calcular descuentos (items marcados como descuento)
  SELECT COALESCE(ABS(SUM(line_total)), 0)
  INTO budget_discount_amount
  FROM public."NEW_Budget_Items"
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
    AND is_discount = true;
  
  -- Calcular subtotal: componentes base + items - descuentos
  budget_subtotal := base_components_total + items_total - budget_discount_amount;
  
  -- Calcular IVA sobre el subtotal
  budget_iva_amount := budget_subtotal * (iva_rate / 100);
  
  -- Calcular total
  budget_total := budget_subtotal + budget_iva_amount;
  
  -- Actualizar presupuesto
  UPDATE public."NEW_Budget"
  SET 
    subtotal = budget_subtotal,
    discount_amount = budget_discount_amount,
    total = budget_total,
    updated_at = now()
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recrear los triggers
CREATE OR REPLACE TRIGGER trigger_calculate_new_budget_totals_insert
  AFTER INSERT ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_new_budget_totals();

CREATE OR REPLACE TRIGGER trigger_calculate_new_budget_totals_update
  AFTER UPDATE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_new_budget_totals();

CREATE OR REPLACE TRIGGER trigger_calculate_new_budget_totals_delete
  AFTER DELETE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_new_budget_totals();

-- También crear trigger para cuando se actualizan los datos base del presupuesto
CREATE OR REPLACE TRIGGER trigger_calculate_new_budget_totals_budget_update
  AFTER UPDATE OF base_price, pack_price, electric_system_price, color_modifier, iva_rate ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_new_budget_totals();

-- Forzar recálculo de todos los presupuestos
UPDATE public."NEW_Budget" SET updated_at = now() WHERE id IN (
  SELECT DISTINCT budget_id 
  FROM public."NEW_Budget_Items" 
  WHERE budget_id IS NOT NULL
);

-- También recalcular presupuestos sin items
INSERT INTO public."NEW_Budget_Items" (budget_id, name, price, line_total, quantity, is_custom, is_discount)
SELECT id, 'temp_trigger_item', 0, 0, 1, true, false 
FROM public."NEW_Budget" 
WHERE id NOT IN (SELECT DISTINCT budget_id FROM public."NEW_Budget_Items" WHERE budget_id IS NOT NULL);

DELETE FROM public."NEW_Budget_Items" WHERE name = 'temp_trigger_item';