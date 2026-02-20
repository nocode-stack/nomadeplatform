
-- Limpiar datos inconsistentes existentes
-- Remover códigos de proyecto de prospects
UPDATE public."NEW_Projects" 
SET project_code = NULL 
WHERE id IN (
  SELECT p.id 
  FROM public."NEW_Projects" p 
  JOIN public."NEW_Clients" c ON p.client_id = c.id 
  WHERE c.client_status = 'prospect' 
  AND p.project_code IS NOT NULL
);

-- Remover slot_id de proyectos de prospects
UPDATE public."NEW_Projects" 
SET slot_id = NULL 
WHERE id IN (
  SELECT p.id 
  FROM public."NEW_Projects" p 
  JOIN public."NEW_Clients" c ON p.client_id = c.id 
  WHERE c.client_status = 'prospect' 
  AND p.slot_id IS NOT NULL
);

-- Liberar slots que estaban asignados a prospects
UPDATE public."NEW_Production_Schedule" 
SET project_id = NULL 
WHERE project_id IN (
  SELECT p.id 
  FROM public."NEW_Projects" p 
  JOIN public."NEW_Clients" c ON p.client_id = c.id 
  WHERE c.client_status = 'prospect'
);

-- Crear función para validar asignaciones de códigos de proyecto
CREATE OR REPLACE FUNCTION public.validate_project_code_assignment()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  client_status_val text;
BEGIN
  -- Obtener el estado del cliente
  SELECT c.client_status INTO client_status_val
  FROM public."NEW_Clients" c
  WHERE c.id = NEW.client_id;
  
  -- Si se está intentando asignar un código de proyecto a un prospect, limpiar el campo
  IF client_status_val = 'prospect' AND NEW.project_code IS NOT NULL THEN
    NEW.project_code := NULL;
    RAISE NOTICE 'Código de proyecto removido: los prospects no pueden tener códigos de proyecto';
  END IF;
  
  -- Si se está intentando asignar un slot a un prospect, limpiar el campo
  IF client_status_val = 'prospect' AND NEW.slot_id IS NOT NULL THEN
    NEW.slot_id := NULL;
    RAISE NOTICE 'Slot de producción removido: los prospects no pueden tener slots asignados';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear trigger para validar asignaciones
DROP TRIGGER IF EXISTS validate_project_code_assignment_trigger ON public."NEW_Projects";
CREATE TRIGGER validate_project_code_assignment_trigger
  BEFORE INSERT OR UPDATE ON public."NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_project_code_assignment();

-- Actualizar la función de conversión de cliente para ser más robusta
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
