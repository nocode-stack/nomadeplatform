-- Solucionar DEFINITIVAMENTE la ambigüedad de budget_code
CREATE OR REPLACE FUNCTION public.generate_budget_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  result_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año usando alias para la tabla
  SELECT COALESCE(MAX(CAST(RIGHT(nb.budget_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Budget" nb
  WHERE nb.budget_code LIKE 'BG_' || year_suffix || '%';
  
  -- Format: BG_año(2 dígitos)_número secuencial(3 dígitos)
  result_code := 'BG_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result_code;
END;
$function$;

-- Verificar que el trigger existe y funciona correctamente
CREATE OR REPLACE FUNCTION public.set_budget_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.budget_code IS NULL OR NEW.budget_code = '' THEN
    NEW.budget_code := generate_budget_code();
  END IF;
  RETURN NEW;
END;
$function$;

-- Recrear el trigger por si no existe
DROP TRIGGER IF EXISTS set_budget_code_trigger ON public."NEW_Budget";
CREATE TRIGGER set_budget_code_trigger
  BEFORE INSERT ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION set_budget_code();