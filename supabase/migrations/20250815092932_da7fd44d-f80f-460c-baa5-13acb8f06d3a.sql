-- Crear función para verificar si un email existe en auth.users (sin exponer datos sensibles)
CREATE OR REPLACE FUNCTION public.check_auth_user_exists(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Solo retornar si el usuario existe, sin exponer datos
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = user_email
  );
END;
$$;