-- Arreglar el problema de email_change NULL en auth.users
-- Actualizar todos los usuarios que tienen email_change NULL a string vacío
UPDATE auth.users 
SET email_change = '' 
WHERE email_change IS NULL;

-- Crear un trigger para asegurar que email_change nunca sea NULL en el futuro
CREATE OR REPLACE FUNCTION auth.ensure_email_change_not_null()
RETURNS TRIGGER AS $$
BEGIN
  -- Si email_change es NULL, establecerlo como string vacío
  IF NEW.email_change IS NULL THEN
    NEW.email_change := '';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar el trigger a la tabla auth.users
DROP TRIGGER IF EXISTS ensure_email_change_not_null_trigger ON auth.users;
CREATE TRIGGER ensure_email_change_not_null_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.ensure_email_change_not_null();