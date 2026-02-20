-- Forzar recálculo manual de todos los presupuestos
DO $$
DECLARE
    budget_record RECORD;
    budget_subtotal NUMERIC(10,2);
    budget_discount_amount NUMERIC(10,2);
    budget_iva_amount NUMERIC(10,2);
    budget_total NUMERIC(10,2);
    iva_rate NUMERIC(4,2);
    base_components_total NUMERIC(10,2);
    items_total NUMERIC(10,2);
BEGIN
    FOR budget_record IN 
        SELECT id, base_price, pack_price, electric_system_price, color_modifier, iva_rate 
        FROM public."NEW_Budget"
    LOOP
        -- Calcular componentes base
        base_components_total := COALESCE(budget_record.base_price, 0) + 
                                COALESCE(budget_record.pack_price, 0) + 
                                COALESCE(budget_record.electric_system_price, 0) + 
                                COALESCE(budget_record.color_modifier, 0);
        
        -- Obtener tasa de IVA
        iva_rate := COALESCE(budget_record.iva_rate, 21.00);
        
        -- Calcular total de items normales
        SELECT COALESCE(SUM(line_total), 0)
        INTO items_total
        FROM public."NEW_Budget_Items"
        WHERE budget_id = budget_record.id
          AND is_discount = false;
        
        -- Calcular descuentos
        SELECT COALESCE(ABS(SUM(line_total)), 0)
        INTO budget_discount_amount
        FROM public."NEW_Budget_Items"
        WHERE budget_id = budget_record.id
          AND is_discount = true;
        
        -- Calcular subtotal
        budget_subtotal := base_components_total + items_total - budget_discount_amount;
        
        -- Calcular IVA
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
        WHERE id = budget_record.id;
        
    END LOOP;
END $$;