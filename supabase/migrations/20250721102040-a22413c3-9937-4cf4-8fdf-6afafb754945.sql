
-- Paso 1: Eliminar el trigger conflictivo que asigna códigos automáticamente
DROP TRIGGER IF EXISTS set_project_code_trigger ON public."NEW_Projects";

-- Paso 2: Modificar la función para que NO genere códigos automáticamente para prospects
CREATE OR REPLACE FUNCTION public.set_project_code_for_clients()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Esta función ya no debe generar códigos automáticamente
  -- Solo se usará si se necesita en el futuro para casos específicos
  RETURN NEW;
END;
$function$;

-- Paso 3: Actualizar la función de conversión para asignar códigos cronológicamente
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
      -- Si existe proyecto, actualizar estado y asignar código AHORA (cronológicamente)
      UPDATE public."NEW_Projects"
      SET 
        status = 'pre_production',
        project_code = generate_project_code(),
        updated_at = now()
      WHERE id = existing_project_id;
    ELSE
      -- Si no existe proyecto, crear uno nuevo CON código (ya es cliente)
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

-- Paso 4: Actualizar la función para asegurar que prospects tienen proyectos SIN código
CREATE OR REPLACE FUNCTION public.ensure_prospect_has_project()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo para prospects nuevos
  IF NEW.client_status = 'prospect' THEN
    -- Crear proyecto SIN código para el prospect
    INSERT INTO public."NEW_Projects" (
      client_id,
      client_name,
      status
    ) VALUES (
      NEW.id,
      NEW.name,
      'creacion_cliente'
    );
    -- Nota: project_code se deja NULL intencionalmente
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Paso 5: Actualizar la función de generación de códigos para ser más precisa
CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  result_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial SOLO para proyectos con código existente
  -- Esto asegura secuencia cronológica basada en CONVERSIÓN, no creación de proyecto
  SELECT COALESCE(MAX(CAST(RIGHT(p.project_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Projects" p
  WHERE p.project_code LIKE 'PR_' || year_suffix || '%'
  AND p.project_code IS NOT NULL;
  
  -- Format: PR_año(2 dígitos)_número secuencial(3 dígitos)
  result_code := 'PR_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result_code;
END;
$function$;

-- Paso 6: Limpiar datos existentes - quitar códigos de prospects actuales
UPDATE public."NEW_Projects" 
SET project_code = NULL 
WHERE client_id IN (
  SELECT id FROM public."NEW_Clients" 
  WHERE client_status = 'prospect'
);

-- Paso 7: Verificar el estado actual
SELECT 
  c.client_status,
  COUNT(*) as total_projects,
  COUNT(p.project_code) as projects_with_code,
  COUNT(*) - COUNT(p.project_code) as projects_without_code
FROM public."NEW_Projects" p
JOIN public."NEW_Clients" c ON p.client_id = c.id
GROUP BY c.client_status
ORDER BY c.client_status;
