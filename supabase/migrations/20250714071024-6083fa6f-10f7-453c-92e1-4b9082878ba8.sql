-- Arreglar la función de cálculo de totales para manejar correctamente los descuentos
-- Los descuentos deben calcularse por separado y no incluirse en el subtotal base

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
BEGIN
  -- Obtener la tasa de IVA del presupuesto
  SELECT b.iva_rate INTO iva_rate
  FROM public."NEW_Budget" b
  WHERE b.id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Si no hay tasa de IVA, usar 21% por defecto
  IF iva_rate IS NULL THEN
    iva_rate := 21.00;
  END IF;
  
  -- Calcular subtotal (solo items normales, no descuentos)
  SELECT COALESCE(SUM(line_total), 0)
  INTO budget_subtotal
  FROM public."NEW_Budget_Items"
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
    AND is_discount = false;
  
  -- Calcular descuentos (items marcados como descuento)
  SELECT COALESCE(ABS(SUM(line_total)), 0)
  INTO budget_discount_amount
  FROM public."NEW_Budget_Items"
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
    AND is_discount = true;
  
  -- Aplicar descuentos al subtotal
  budget_subtotal := budget_subtotal - budget_discount_amount;
  
  -- Calcular IVA sobre el subtotal después de descuentos
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

-- Recalcular totales existentes para corregir los datos
UPDATE public."NEW_Budget" SET updated_at = now() WHERE id IN (
  SELECT DISTINCT budget_id 
  FROM public."NEW_Budget_Items" 
  WHERE budget_id IS NOT NULL
);