-- Corregir la función para evitar ambigüedad de nombres
CREATE OR REPLACE FUNCTION public.generate_incident_reference_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  new_reference_number TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(inc.reference_number, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM "NEW_Incidents" inc
  WHERE inc.reference_number LIKE 'IN_' || year_suffix || '%';
  
  -- Format: IN_ + año(2 dígitos) + _ + número secuencial(3 dígitos)
  new_reference_number := 'IN_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_reference_number;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_set_incident_reference_number ON "NEW_Incidents";

CREATE TRIGGER trigger_set_incident_reference_number
  BEFORE INSERT ON "NEW_Incidents"
  FOR EACH ROW
  EXECUTE FUNCTION set_incident_reference_number();