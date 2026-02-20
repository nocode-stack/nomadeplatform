-- Fix Function Search Path Mutable security warnings
-- Adding SET search_path TO 'public' to all functions for security

-- Fix generate_production_code function
CREATE OR REPLACE FUNCTION public.generate_production_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  production_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(production_code, 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM production_slots
  WHERE production_code LIKE 'N' || year_suffix || '%';
  
  -- Format: N + año(2 dígitos) + número secuencial(2 dígitos)
  production_code := 'N' || year_suffix || LPAD(next_number::TEXT, 2, '0');
  
  RETURN production_code;
END;
$function$;

-- Fix track_delivery_date_changes function
CREATE OR REPLACE FUNCTION public.track_delivery_date_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo registrar si la fecha de entrega cambió
  IF OLD.delivery_date IS DISTINCT FROM NEW.delivery_date THEN
    INSERT INTO public.delivery_date_history (
      project_id,
      old_delivery_date,
      new_delivery_date,
      change_reason,
      changed_by
    ) VALUES (
      NEW.project_id,
      OLD.delivery_date,
      NEW.delivery_date,
      'Updated via production schedule',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_phase_progress_changes function
CREATE OR REPLACE FUNCTION public.validate_phase_progress_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Fix generate_budget_number function
CREATE OR REPLACE FUNCTION public.generate_budget_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  budget_number TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(budget_number, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM budgets
  WHERE budget_number LIKE 'PRE' || year_suffix || '%';
  
  -- Format: PRE + año(2 dígitos) + número secuencial(3 dígitos)
  budget_number := 'PRE' || year_suffix || LPAD(next_number::TEXT, 3, '0');
  
  RETURN budget_number;
END;
$function$;

-- Fix set_budget_number function
CREATE OR REPLACE FUNCTION public.set_budget_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.budget_number IS NULL OR NEW.budget_number = '' THEN
    NEW.budget_number := generate_budget_number();
  END IF;
  RETURN NEW;
END;
$function$;