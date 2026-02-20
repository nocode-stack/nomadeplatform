-- Crear usuarios faltantes y actualizar contraseñas de todos los usuarios corporativos

-- Función auxiliar para insertar usuarios de forma segura
CREATE OR REPLACE FUNCTION create_user_if_not_exists(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_department TEXT
) RETURNS VOID AS $$
DECLARE
  user_uuid UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Verificar si el usuario ya existe
  SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
  
  -- Si no existe, crearlo
  IF user_uuid IS NULL THEN
    -- Generar un UUID para el nuevo usuario
    user_uuid := gen_random_uuid();
    
    -- Insertar en auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change_token_new,
      recovery_token
    ) VALUES (
      user_uuid,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      ''
    );
    
    -- Insertar en user_profiles solo si no existe
    INSERT INTO public.user_profiles (
      id,
      user_id,
      email,
      name,
      department,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      user_uuid,
      user_email,
      user_name,
      user_department,
      now(),
      now()
    );
  ELSE
    -- Si existe, actualizar contraseña
    UPDATE auth.users SET 
      encrypted_password = crypt(user_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = user_uuid;
    
    -- Verificar si el perfil existe
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = user_uuid) INTO profile_exists;
    
    IF profile_exists THEN
      -- Actualizar perfil existente
      UPDATE public.user_profiles SET 
        name = user_name,
        department = user_department,
        updated_at = now()
      WHERE user_id = user_uuid;
    ELSE
      -- Crear perfil si no existe
      INSERT INTO public.user_profiles (
        id,
        user_id,
        email,
        name,
        department,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        user_uuid,
        user_email,
        user_name,
        user_department,
        now(),
        now()
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear/actualizar todos los usuarios corporativos
SELECT create_user_if_not_exists('mescude@nomade-nation.com', 'Marc2022$', 'Marc Escude', 'CFO');
SELECT create_user_if_not_exists('amirallas@nomade-nation.com', 'Arnau2022$', 'Arnau Mirallas', 'Comercial');
SELECT create_user_if_not_exists('youssef@nomade-nation.com', 'Youssef2022$', 'Youssef', 'Comercial');
SELECT create_user_if_not_exists('elizza@nomade-nation.com', 'Elena2022$', 'Elena Lizza', 'Dir. Customer');
SELECT create_user_if_not_exists('msanz@nomade-nation.com', 'Marina2022$', 'Marina Sanz', 'Dir. Marketing');
SELECT create_user_if_not_exists('iribo@nomade-nation.com', '628310145', 'Ivan Ribo', 'CEO');

-- Limpiar función auxiliar
DROP FUNCTION create_user_if_not_exists(TEXT, TEXT, TEXT, TEXT);