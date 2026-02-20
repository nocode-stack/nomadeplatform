
-- Modificar la función set_client_code para manejar cambios de estado
CREATE OR REPLACE FUNCTION public.set_client_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Para INSERT: Solo generar código si client_code es NULL o vacío
  IF TG_OP = 'INSERT' THEN
    IF NEW.client_code IS NULL OR NEW.client_code = '' THEN
      IF NEW.client_status = 'prospect' THEN
        NEW.client_code := generate_prospect_code();
      ELSE
        NEW.client_code := generate_client_code();
      END IF;
    END IF;
  
  -- Para UPDATE: Solo cambiar código si cambió el client_status de prospect a client
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.client_status = 'prospect' AND NEW.client_status = 'client' THEN
      -- Cambiar de código prospect a código de cliente
      NEW.client_code := generate_client_code();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Actualizar el trigger para que funcione en INSERT y UPDATE
DROP TRIGGER IF EXISTS trigger_set_client_code ON public."NEW_Clients";
CREATE TRIGGER trigger_set_client_code
  BEFORE INSERT OR UPDATE ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION set_client_code();

-- Migrar datos existentes: cambiar códigos PC_ a CL_ para clientes existentes
-- Primero obtener todos los clientes con status 'client' pero código PC_
DO $$
DECLARE
  client_record RECORD;
  new_client_code TEXT;
BEGIN
  FOR client_record IN 
    SELECT id, client_code, name, created_at
    FROM public."NEW_Clients" 
    WHERE client_status = 'client' 
    AND client_code LIKE 'PC_%'
    ORDER BY created_at ASC
  LOOP
    -- Generar nuevo código de cliente manteniendo orden cronológico
    new_client_code := generate_client_code();
    
    -- Actualizar el código sin activar el trigger (para evitar recursión)
    UPDATE public."NEW_Clients" 
    SET client_code = new_client_code
    WHERE id = client_record.id;
    
    RAISE NOTICE 'Cliente % migrado de % a %', client_record.name, client_record.client_code, new_client_code;
  END LOOP;
END $$;
