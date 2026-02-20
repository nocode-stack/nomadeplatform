-- Arreglar la función generate_new_budget_code para resolver ambigüedad de columnas
CREATE OR REPLACE FUNCTION public.generate_new_budget_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  new_budget_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(nbs.budget_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Budget_Structure" nbs
  WHERE nbs.budget_code LIKE 'BG_' || year_suffix || '%';
  
  -- Format: BG_año(2 dígitos)_número secuencial(3 dígitos)
  new_budget_code := 'BG_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_budget_code;
END;
$function$;