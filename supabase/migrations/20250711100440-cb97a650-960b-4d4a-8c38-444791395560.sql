-- Verificar y recrear el trigger definitivamente
-- Primero verificar que no existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'NEW_Incidents';

-- Crear el trigger
CREATE TRIGGER trigger_set_incident_reference_number
  BEFORE INSERT ON "NEW_Incidents"
  FOR EACH ROW
  EXECUTE FUNCTION set_incident_reference_number();

-- Verificar que se creó
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'NEW_Incidents';