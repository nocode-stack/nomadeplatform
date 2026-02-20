
-- Añadir campo project_code a la tabla clients
ALTER TABLE public.clients 
ADD COLUMN project_code text;

-- Actualizar los clientes existentes con el código de su proyecto actual
UPDATE public.clients 
SET project_code = p.code
FROM public.projects p
WHERE clients.id = p.client_id;

-- Crear función para sincronizar el project_code cuando se actualiza un proyecto
CREATE OR REPLACE FUNCTION public.sync_client_project_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el código del proyecto cambió, actualizar el cliente
  IF OLD.code IS DISTINCT FROM NEW.code OR OLD.client_id IS DISTINCT FROM NEW.client_id THEN
    -- Limpiar el código del cliente anterior si cambió de cliente
    IF OLD.client_id IS DISTINCT FROM NEW.client_id AND OLD.client_id IS NOT NULL THEN
      UPDATE public.clients 
      SET project_code = NULL 
      WHERE id = OLD.client_id;
    END IF;
    
    -- Asignar el código al cliente nuevo/actual
    IF NEW.client_id IS NOT NULL THEN
      UPDATE public.clients 
      SET project_code = NEW.code 
      WHERE id = NEW.client_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para sincronizar automáticamente
CREATE TRIGGER sync_client_project_code_trigger
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_project_code();

-- También crear trigger para nuevos proyectos
CREATE OR REPLACE FUNCTION public.sync_client_project_code_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Asignar el código al cliente cuando se crea un proyecto
  IF NEW.client_id IS NOT NULL THEN
    UPDATE public.clients 
    SET project_code = NEW.code 
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_client_project_code_insert_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_project_code_on_insert();
