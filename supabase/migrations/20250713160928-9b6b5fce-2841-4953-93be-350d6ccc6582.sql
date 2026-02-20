-- Corregir la función para usar la tabla correcta NEW_Budget
CREATE OR REPLACE FUNCTION public.generate_budget_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  budget_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(budget_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Budget"
  WHERE budget_code LIKE 'BG_' || year_suffix || '%';
  
  -- Format: BG_año(2 dígitos)_número secuencial(3 dígitos)
  budget_code := 'BG_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN budget_code;
END;
$function$;