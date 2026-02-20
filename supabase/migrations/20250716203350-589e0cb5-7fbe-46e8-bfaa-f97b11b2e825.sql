-- Crear el trigger que ejecuta la función de notificación cuando se actualiza una incidencia
CREATE TRIGGER trigger_notify_incident_status_change
  AFTER UPDATE ON public."NEW_Incidents"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_incident_status_change();