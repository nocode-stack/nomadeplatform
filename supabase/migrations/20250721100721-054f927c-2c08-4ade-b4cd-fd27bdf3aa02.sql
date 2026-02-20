
-- Actualizar el enum project_status para cambiar 'prospect' por 'creacion_cliente'
ALTER TYPE project_status RENAME TO project_status_old;

CREATE TYPE project_status AS ENUM (
  'creacion_cliente',
  'pre_production', 
  'production', 
  'reworks', 
  'pre_delivery', 
  'delivered',
  'repair'
);

-- Actualizar la tabla NEW_Projects para usar el nuevo enum
ALTER TABLE "NEW_Projects" 
ALTER COLUMN status TYPE project_status 
USING CASE 
  WHEN status::text = 'prospect' THEN 'creacion_cliente'::project_status
  ELSE status::text::project_status
END;

-- Eliminar el enum antiguo
DROP TYPE project_status_old;

-- Actualizar las funciones que usan el enum para referenciar el nuevo valor
CREATE OR REPLACE FUNCTION public.calculate_project_status(project_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  completed_phases TEXT[];
  project_status TEXT;
  total_phases INTEGER;
  completed_count INTEGER;
  progress_percentage INTEGER;
  is_manual_control BOOLEAN;
BEGIN
  -- Verificar si el proyecto está en modo manual
  SELECT manual_status_control INTO is_manual_control
  FROM "NEW_Projects" 
  WHERE id = project_id_param;
  
  -- Si está en modo manual, no actualizar el estado automáticamente
  IF is_manual_control THEN
    RETURN (SELECT status::text FROM "NEW_Projects" WHERE id = project_id_param);
  END IF;
  
  -- Obtener grupos de fases completadas
  SELECT ARRAY_AGG(DISTINCT pt."group")
  INTO completed_phases
  FROM "NEW_Project_Phase_Progress" ppp
  JOIN "NEW_Project_Phase_Template" pt ON ppp.phase_template_id = pt.id
  WHERE ppp.project_id = project_id_param AND ppp.status = 'completed';
  
  -- Calcular progreso como porcentaje
  SELECT COUNT(*) INTO total_phases
  FROM "NEW_Project_Phase_Progress" ppp
  WHERE ppp.project_id = project_id_param;
  
  SELECT COUNT(*) INTO completed_count
  FROM "NEW_Project_Phase_Progress" ppp
  WHERE ppp.project_id = project_id_param AND ppp.status = 'completed';
  
  IF total_phases > 0 THEN
    progress_percentage := ROUND((completed_count::DECIMAL / total_phases::DECIMAL) * 100);
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Determinar estado basado en fases completadas
  IF 'delivered' = ANY(completed_phases) THEN
    project_status := 'delivered';
  ELSIF 'pre_delivery' = ANY(completed_phases) THEN
    project_status := 'pre_delivery';
  ELSIF 'reworks' = ANY(completed_phases) THEN
    project_status := 'reworks';
  ELSIF 'production' = ANY(completed_phases) THEN
    project_status := 'production';
  ELSIF 'pre_production' = ANY(completed_phases) THEN
    project_status := 'pre_production';
  ELSE
    project_status := 'creacion_cliente';
  END IF;
  
  -- Actualizar el estado y progreso del proyecto
  UPDATE "NEW_Projects" 
  SET status = project_status::project_status,
      updated_at = now()
  WHERE id = project_id_param;
  
  RETURN project_status;
END;
$function$;

-- Actualizar función para crear proyectos en conversión de cliente
CREATE OR REPLACE FUNCTION public.create_project_on_client_conversion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  existing_project_id uuid;
BEGIN
  -- Solo cuando se convierte de prospect a cliente
  IF OLD.client_status = 'prospect' AND NEW.client_status = 'client' THEN
    -- Verificar si ya existe un proyecto para este cliente
    SELECT id INTO existing_project_id
    FROM public."NEW_Projects" 
    WHERE client_id = NEW.id;
    
    IF existing_project_id IS NOT NULL THEN
      -- Si existe proyecto, actualizar estado y asignar código
      UPDATE public."NEW_Projects"
      SET 
        status = 'pre_production',
        project_code = CASE 
          WHEN project_code IS NULL OR project_code = '' 
          THEN generate_project_code() 
          ELSE project_code 
        END,
        updated_at = now()
      WHERE id = existing_project_id;
    ELSE
      -- Si no existe proyecto, crear uno nuevo
      INSERT INTO public."NEW_Projects" (
        client_id,
        client_name,
        status,
        project_code
      ) VALUES (
        NEW.id,
        NEW.name,
        'pre_production',
        generate_project_code()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear función para asegurar que prospects tienen proyectos
CREATE OR REPLACE FUNCTION public.ensure_prospect_has_project()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo para prospects nuevos
  IF NEW.client_status = 'prospect' THEN
    -- Crear proyecto sin código para el prospect
    INSERT INTO public."NEW_Projects" (
      client_id,
      client_name,
      status
    ) VALUES (
      NEW.id,
      NEW.name,
      'creacion_cliente'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear trigger para asegurar que nuevos prospects tienen proyectos
DROP TRIGGER IF EXISTS ensure_prospect_project_trigger ON public."NEW_Clients";
CREATE TRIGGER ensure_prospect_project_trigger
  AFTER INSERT ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_prospect_has_project();
