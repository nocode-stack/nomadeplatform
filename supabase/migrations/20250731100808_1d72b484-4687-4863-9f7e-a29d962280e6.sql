-- Actualizar contraseñas de usuarios existentes y crear usuarios faltantes

-- Primero, actualizar contraseñas de usuarios existentes
UPDATE auth.users SET 
    encrypted_password = CASE 
        WHEN email = 'mescude@nomade-nation.com' THEN crypt('Marc2022$', gen_salt('bf'))
        WHEN email = 'amirallas@nomade-nation.com' THEN crypt('Arnau2022$', gen_salt('bf'))
        WHEN email = 'youssef@nomade-nation.com' THEN crypt('Youssef2022$', gen_salt('bf'))
        WHEN email = 'elizza@nomade-nation.com' THEN crypt('Elena2022$', gen_salt('bf'))
        WHEN email = 'msanz@nomade-nation.com' THEN crypt('Marina2022$', gen_salt('bf'))
        WHEN email = 'iribo@nomade-nation.com' THEN crypt('628310145', gen_salt('bf'))
        ELSE encrypted_password
    END,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email IN (
    'mescude@nomade-nation.com',
    'amirallas@nomade-nation.com', 
    'youssef@nomade-nation.com',
    'elizza@nomade-nation.com',
    'msanz@nomade-nation.com',
    'iribo@nomade-nation.com'
);

-- Crear usuarios que no existen
DO $$
DECLARE
    user_data RECORD;
    new_user_id UUID;
BEGIN
    -- Array de usuarios a crear/verificar
    FOR user_data IN 
        SELECT * FROM (VALUES 
            ('mescude@nomade-nation.com', 'Marc2022$', 'Marc Escude', 'CFO'),
            ('amirallas@nomade-nation.com', 'Arnau2022$', 'Arnau Mirallas', 'Comercial'),
            ('youssef@nomade-nation.com', 'Youssef2022$', 'Youssef', 'Comercial'),
            ('elizza@nomade-nation.com', 'Elena2022$', 'Elena Lizza', 'Dir. Customer'),
            ('msanz@nomade-nation.com', 'Marina2022$', 'Marina Sanz', 'Dir. Marketing'),
            ('iribo@nomade-nation.com', '628310145', 'Ivan Ribo', 'CEO')
        ) AS t(email, password, name, department)
    LOOP
        -- Verificar si el usuario no existe y crearlo
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_data.email) THEN
            new_user_id := gen_random_uuid();
            
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
                new_user_id,
                '00000000-0000-0000-0000-000000000000',
                user_data.email,
                crypt(user_data.password, gen_salt('bf')),
                now(),
                now(),
                now(),
                'authenticated',
                'authenticated',
                '',
                '',
                ''
            );
            
            -- Crear perfil correspondiente
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
                new_user_id,
                user_data.email,
                user_data.name,
                user_data.department,
                now(),
                now()
            );
        END IF;
    END LOOP;
END $$;

-- Actualizar perfiles existentes con la información correcta
UPDATE public.user_profiles SET 
    name = CASE 
        WHEN email = 'mescude@nomade-nation.com' THEN 'Marc Escude'
        WHEN email = 'amirallas@nomade-nation.com' THEN 'Arnau Mirallas'
        WHEN email = 'youssef@nomade-nation.com' THEN 'Youssef'
        WHEN email = 'elizza@nomade-nation.com' THEN 'Elena Lizza'
        WHEN email = 'msanz@nomade-nation.com' THEN 'Marina Sanz'
        WHEN email = 'iribo@nomade-nation.com' THEN 'Ivan Ribo'
        ELSE name
    END,
    department = CASE 
        WHEN email = 'mescude@nomade-nation.com' THEN 'CFO'
        WHEN email = 'amirallas@nomade-nation.com' THEN 'Comercial'
        WHEN email = 'youssef@nomade-nation.com' THEN 'Comercial'
        WHEN email = 'elizza@nomade-nation.com' THEN 'Dir. Customer'
        WHEN email = 'msanz@nomade-nation.com' THEN 'Dir. Marketing'
        WHEN email = 'iribo@nomade-nation.com' THEN 'CEO'
        ELSE department
    END,
    updated_at = now()
WHERE email IN (
    'mescude@nomade-nation.com',
    'amirallas@nomade-nation.com', 
    'youssef@nomade-nation.com',
    'elizza@nomade-nation.com',
    'msanz@nomade-nation.com',
    'iribo@nomade-nation.com'
);