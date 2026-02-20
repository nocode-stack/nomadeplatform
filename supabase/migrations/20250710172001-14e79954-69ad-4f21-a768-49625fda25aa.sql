-- Crear funciones para generar códigos automáticos (corregidas)

-- 1. Función para generar códigos de cliente (CL_25_001)
CREATE OR REPLACE FUNCTION public.generate_client_code()
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
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(client_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM "NEW_Clients"
  WHERE client_code LIKE 'CL_' || year_suffix || '%';
  
  -- Format: CL + año(2 dígitos) + número secuencial(3 dígitos con ceros)
  result_code := 'CL_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result_code;
END;
$function$;

-- 2. Función para generar códigos de proyecto (PR_25_001)
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
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(project_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM "NEW_Projects"
  WHERE project_code LIKE 'PR_' || year_suffix || '%';
  
  -- Format: PR + año(2 dígitos) + número secuencial(3 dígitos con ceros)
  result_code := 'PR_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result_code;
END;
$function$;

-- 3. Trigger para asignar códigos automáticamente a NEW_Clients
CREATE OR REPLACE FUNCTION public.set_client_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.client_code IS NULL OR NEW.client_code = '' THEN
    NEW.client_code := generate_client_code();
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Trigger para asignar códigos automáticamente a NEW_Projects
CREATE OR REPLACE FUNCTION public.set_project_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    NEW.project_code := generate_project_code();
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Crear los triggers
DROP TRIGGER IF EXISTS trigger_set_client_code ON "NEW_Clients";
CREATE TRIGGER trigger_set_client_code
  BEFORE INSERT ON "NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION set_client_code();

DROP TRIGGER IF EXISTS trigger_set_project_code ON "NEW_Projects";
CREATE TRIGGER trigger_set_project_code
  BEFORE INSERT ON "NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION set_project_code();

-- 6. Actualizar registros existentes sin códigos
UPDATE "NEW_Clients" 
SET client_code = generate_client_code() 
WHERE client_code IS NULL OR client_code = '';

UPDATE "NEW_Projects" 
SET project_code = generate_project_code() 
WHERE project_code IS NULL OR project_code = '';