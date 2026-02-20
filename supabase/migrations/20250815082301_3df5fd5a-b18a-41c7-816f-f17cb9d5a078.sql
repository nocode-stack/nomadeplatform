-- Solución completa para el problema de registro de usuarios

-- 1. Crear perfiles faltantes para usuarios existentes en auth.users
INSERT INTO public.user_profiles (user_id, name, email, department)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    au.email,
    COALESCE(au.raw_user_meta_data->>'department', 'Sin departamento') as department
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- 2. Recrear el trigger que falla para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Crear una función mejorada para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name, email, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Sin departamento')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, logear el error pero no bloquear el registro
    RAISE NOTICE 'Error creando perfil de usuario: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Función auxiliar para crear perfiles manualmente si fallan
CREATE OR REPLACE FUNCTION public.create_user_profile_if_missing(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_data RECORD;
BEGIN
  -- Verificar si ya existe el perfil
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = user_id_param) THEN
    RETURN true;
  END IF;
  
  -- Obtener datos del usuario de auth.users
  SELECT id, email, raw_user_meta_data INTO user_data
  FROM auth.users 
  WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Crear el perfil
  INSERT INTO public.user_profiles (user_id, name, email, department)
  VALUES (
    user_data.id,
    COALESCE(user_data.raw_user_meta_data->>'name', user_data.email),
    user_data.email,
    COALESCE(user_data.raw_user_meta_data->>'department', 'Sin departamento')
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creando perfil manualmente: %', SQLERRM;
    RETURN false;
END;
$$;