-- Fix the budget totals calculation trigger to handle missing budget_id
CREATE OR REPLACE FUNCTION public.calculate_new_budget_totals()
RETURNS TRIGGER
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
  target_budget_id UUID;
BEGIN
  -- Determine which budget ID to use
  IF TG_OP = 'DELETE' THEN
    target_budget_id := OLD.budget_id;
  ELSE
    target_budget_id := NEW.budget_id;
  END IF;

  -- Skip if no budget_id
  IF target_budget_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get budget data and IVA rate
  SELECT 
    b.iva_rate,
    COALESCE(b.base_price, 0) + COALESCE(b.pack_price, 0) + COALESCE(b.electric_system_price, 0) + COALESCE(b.color_modifier, 0)
  INTO iva_rate, base_components_total
  FROM public."NEW_Budget" b
  WHERE b.id = target_budget_id;
  
  -- Set default IVA rate if null
  IF iva_rate IS NULL THEN
    iva_rate := 21.00;
  END IF;
  
  -- Calculate items total (non-discount items)
  SELECT COALESCE(SUM(line_total), 0)
  INTO items_total
  FROM public."NEW_Budget_Items"
  WHERE budget_id = target_budget_id
    AND is_discount = false;
  
  -- Calculate discount amount (discount items)
  SELECT COALESCE(ABS(SUM(line_total)), 0)
  INTO budget_discount_amount
  FROM public."NEW_Budget_Items"
  WHERE budget_id = target_budget_id
    AND is_discount = true;
  
  -- Calculate subtotal: base components + items - discounts
  budget_subtotal := base_components_total + items_total - budget_discount_amount;
  
  -- Calculate IVA
  budget_iva_amount := budget_subtotal * (iva_rate / 100);
  
  -- Calculate total
  budget_total := budget_subtotal + budget_iva_amount;
  
  -- Update budget
  UPDATE public."NEW_Budget"
  SET 
    subtotal = budget_subtotal,
    discount_amount = budget_discount_amount,
    total = budget_total,
    updated_at = now()
  WHERE id = target_budget_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;