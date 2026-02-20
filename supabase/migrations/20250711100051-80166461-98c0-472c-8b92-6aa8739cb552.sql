-- Verificar y corregir el trigger para generar reference_number automáticamente

-- Primero eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_set_incident_reference_number ON "NEW_Incidents";
DROP FUNCTION IF EXISTS public.set_incident_reference_number();
DROP FUNCTION IF EXISTS public.generate_incident_reference_number();

-- Recrear la función de generación de reference_number
CREATE OR REPLACE FUNCTION public.generate_incident_reference_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  reference_number TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(reference_number, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM "NEW_Incidents"
  WHERE reference_number LIKE 'IN_' || year_suffix || '%';
  
  -- Format: IN_ + año(2 dígitos) + _ + número secuencial(3 dígitos)
  reference_number := 'IN_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN reference_number;
END;
$$;

-- Crear la función trigger
CREATE OR REPLACE FUNCTION public.set_incident_reference_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo generar si reference_number es NULL o vacío
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_incident_reference_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Crear el trigger en la tabla NEW_Incidents
CREATE TRIGGER trigger_set_incident_reference_number
  BEFORE INSERT ON "NEW_Incidents"
  FOR EACH ROW
  EXECUTE FUNCTION set_incident_reference_number();