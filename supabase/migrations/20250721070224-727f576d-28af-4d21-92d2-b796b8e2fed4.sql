-- Modificar el trigger para que no genere códigos de proyecto automáticamente para prospects
-- Primero eliminamos el trigger existente si existe
DROP TRIGGER IF EXISTS set_project_code_trigger ON public."NEW_Projects";

-- Crear una nueva función que solo genere códigos para clientes convertidos
CREATE OR REPLACE FUNCTION public.set_project_code_for_clients()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo generar código de proyecto si es un cliente (no prospect)
  -- Verificamos el estado del cliente
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    -- Verificar si el cliente asociado es un cliente real (no prospect)
    IF EXISTS (
      SELECT 1 FROM public."NEW_Clients" 
      WHERE id = NEW.client_id 
      AND client_status = 'client'
    ) THEN
      NEW.project_code := generate_project_code();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Crear el nuevo trigger
CREATE TRIGGER set_project_code_trigger
BEFORE INSERT OR UPDATE ON public."NEW_Projects"
FOR EACH ROW
EXECUTE FUNCTION public.set_project_code_for_clients();