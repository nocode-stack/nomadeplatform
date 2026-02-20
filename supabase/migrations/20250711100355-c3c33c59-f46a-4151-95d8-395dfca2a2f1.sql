-- Recrear el trigger correctamente para NEW_Incidents
DROP TRIGGER IF EXISTS trigger_set_incident_reference_number ON "NEW_Incidents";

-- Verificar que la función existe y crearla si no
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

-- Verificar que el trigger se creó
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'NEW_Incidents';