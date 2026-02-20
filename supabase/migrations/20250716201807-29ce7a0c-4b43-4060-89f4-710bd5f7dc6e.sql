-- Crear trigger para asignar automáticamente el estado "fechas_asignadas" cuando se establecen las fechas de reparación
CREATE OR REPLACE FUNCTION public.auto_assign_repair_dates_status()
RETURNS TRIGGER AS $$
DECLARE
  fechas_asignadas_status_id UUID;
BEGIN
  -- Obtener el ID del estado "fechas_asignadas"
  SELECT id INTO fechas_asignadas_status_id
  FROM public."NEW_Incident_Status"
  WHERE status_code = 'fechas_asignadas' AND is_active = true;
  
  -- Si se han establecido ambas fechas de reparación y el estado actual no es ya "fechas_asignadas"
  IF NEW.repair_entry_date IS NOT NULL 
     AND NEW.repair_exit_date IS NOT NULL 
     AND NEW.status_id != fechas_asignadas_status_id 
     AND fechas_asignadas_status_id IS NOT NULL THEN
    
    -- Cambiar automáticamente al estado "fechas_asignadas"
    NEW.status_id := fechas_asignadas_status_id;
    
    RAISE NOTICE 'Estado cambiado automáticamente a "fechas_asignadas" para incidencia: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger que se ejecuta antes de actualizar una incidencia
CREATE TRIGGER trigger_auto_assign_repair_dates_status
  BEFORE UPDATE ON public."NEW_Incidents"
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_repair_dates_status();