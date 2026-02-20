-- Modificar la función de validación para permitir la inicialización automática de fases
-- pero prevenir modificaciones posteriores en proyectos de prospectos
CREATE OR REPLACE FUNCTION public.validate_phase_progress_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo validar si es una actualización (UPDATE), no durante INSERT inicial
  IF TG_OP = 'UPDATE' THEN
    -- Check if client is a prospect
    IF NOT public.check_client_status_for_project(NEW.project_id) THEN
      RAISE EXCEPTION 'No se pueden modificar fases para proyectos de prospectos';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;