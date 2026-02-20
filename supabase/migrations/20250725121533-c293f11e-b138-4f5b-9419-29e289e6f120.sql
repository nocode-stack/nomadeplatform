-- Modificar el trigger para que no sobrescriba estados superiores
CREATE OR REPLACE FUNCTION public.auto_assign_repair_dates_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  fechas_asignadas_status_id UUID;
  current_status_order INTEGER;
  fechas_asignadas_order INTEGER;
BEGIN
  -- Obtener el ID del estado "fechas_asignadas"
  SELECT id INTO fechas_asignadas_status_id
  FROM public."NEW_Incident_Status"
  WHERE status_code = 'fechas_asignadas' AND is_active = true;
  
  -- Obtener el order_index del estado actual
  SELECT nis.order_index INTO current_status_order
  FROM public."NEW_Incident_Status" nis
  WHERE nis.id = NEW.status_id;
  
  -- Obtener el order_index del estado "fechas_asignadas"
  SELECT order_index INTO fechas_asignadas_order
  FROM public."NEW_Incident_Status"
  WHERE id = fechas_asignadas_status_id;
  
  -- Solo cambiar a "fechas_asignadas" si:
  -- 1. Se han establecido ambas fechas de reparación
  -- 2. El estado actual tiene un order_index menor que "fechas_asignadas"
  -- 3. No se está intentando cambiar explícitamente a un estado superior
  IF NEW.repair_entry_date IS NOT NULL 
     AND NEW.repair_exit_date IS NOT NULL 
     AND current_status_order IS NOT NULL
     AND fechas_asignadas_order IS NOT NULL
     AND current_status_order < fechas_asignadas_order
     AND (OLD.repair_entry_date IS NULL OR OLD.repair_exit_date IS NULL) THEN
    
    -- Solo cambiar automáticamente si no se está actualizando explícitamente el status_id
    IF OLD.status_id = NEW.status_id THEN
      NEW.status_id := fechas_asignadas_status_id;
      RAISE NOTICE 'Estado cambiado automáticamente a "fechas_asignadas" para incidencia: %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;