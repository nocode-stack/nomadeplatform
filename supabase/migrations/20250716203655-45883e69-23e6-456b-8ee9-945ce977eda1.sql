-- Crear el trigger automático que asigna el estado "fechas_asignadas" cuando se establecen las fechas
CREATE TRIGGER trigger_auto_assign_repair_dates_status
  BEFORE UPDATE ON public."NEW_Incidents"
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_repair_dates_status();