
-- Fix calculate_new_budget_totals to include base configuration prices and global discount
CREATE OR REPLACE FUNCTION public.calculate_new_budget_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  b_record RECORD;
  items_subtotal NUMERIC(15,2);
  items_discount_amount NUMERIC(15,2);
  total_base_subtotal NUMERIC(15,2);
  global_discount_amount NUMERIC(15,2);
  final_discount_amount NUMERIC(15,2);
  final_subtotal NUMERIC(15,2);
  final_iva_amount NUMERIC(15,2);
  final_total NUMERIC(15,2);
  target_budget_id UUID;
BEGIN
  target_budget_id := COALESCE(NEW.budget_id, OLD.budget_id);

  -- 1. Get base configuration and global settings from NEW_Budget
  SELECT 
    base_price, 
    pack_price, 
    electric_system_price, 
    color_modifier, 
    discount_percentage,
    iva_rate
  INTO b_record
  FROM public."NEW_Budget"
  WHERE id = target_budget_id;
  
  -- Use 21% default if null
  IF b_record.iva_rate IS NULL THEN
    b_record.iva_rate := 21.00;
  END IF;
  
  -- 2. Calculate subtotal of additional items (is_discount = false)
  SELECT COALESCE(SUM(line_total), 0)
  INTO items_subtotal
  FROM public."NEW_Budget_Items"
  WHERE budget_id = target_budget_id
    AND is_discount = false;
  
  -- 3. Calculate sum of discount items (is_discount = true)
  SELECT COALESCE(ABS(SUM(line_total)), 0)
  INTO items_discount_amount
  FROM public."NEW_Budget_Items"
  WHERE budget_id = target_budget_id
    AND is_discount = true;
  
  -- 4. Calculate total base subtotal (Config + Additional items)
  total_base_subtotal := COALESCE(b_record.base_price, 0) + 
                         COALESCE(b_record.pack_price, 0) + 
                         COALESCE(b_record.electric_system_price, 0) + 
                         COALESCE(b_record.color_modifier, 0) + 
                         items_subtotal;
  
  -- 5. Calculate global discount from percentage
  global_discount_amount := total_base_subtotal * COALESCE(b_record.discount_percentage, 0);
  
  -- 6. Total combined discount
  final_discount_amount := items_discount_amount + global_discount_amount;
  
  -- 7. Final subtotal (before IVA)
  final_subtotal := total_base_subtotal - final_discount_amount;
  
  -- 8. Calculate IVA
  final_iva_amount := final_subtotal * (b_record.iva_rate / 100);
  
  -- 9. Final Total
  final_total := final_subtotal + final_iva_amount;
  
  -- 10. Update the budget record
  UPDATE public."NEW_Budget"
  SET 
    subtotal = ROUND(final_subtotal, 2),
    discount_amount = ROUND(final_discount_amount, 2),
    total = ROUND(final_total, 2),
    updated_at = now()
  WHERE id = target_budget_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
