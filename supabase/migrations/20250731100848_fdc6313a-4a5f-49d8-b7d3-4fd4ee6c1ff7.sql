-- Actualizar contraseñas de usuarios existentes
UPDATE auth.users SET 
    encrypted_password = CASE 
        WHEN email = 'mescude@nomade-nation.com' THEN crypt('Marc2022$', gen_salt('bf'))
        WHEN email = 'amirallas@nomade-nation.com' THEN crypt('Arnau2022$', gen_salt('bf'))
        WHEN email = 'iribo@nomade-nation.com' THEN crypt('628310145', gen_salt('bf'))
        ELSE encrypted_password
    END,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email IN (
    'mescude@nomade-nation.com',
    'amirallas@nomade-nation.com',
    'iribo@nomade-nation.com'
);

-- Actualizar perfiles existentes
UPDATE public.user_profiles SET 
    name = CASE 
        WHEN email = 'mescude@nomade-nation.com' THEN 'Marc Escude'
        WHEN email = 'amirallas@nomade-nation.com' THEN 'Arnau Mirallas'
        WHEN email = 'iribo@nomade-nation.com' THEN 'Ivan Ribo'
        ELSE name
    END,
    department = CASE 
        WHEN email = 'mescude@nomade-nation.com' THEN 'CFO'
        WHEN email = 'amirallas@nomade-nation.com' THEN 'Comercial'
        WHEN email = 'iribo@nomade-nation.com' THEN 'CEO'
        ELSE department
    END,
    updated_at = now()
WHERE email IN (
    'mescude@nomade-nation.com',
    'amirallas@nomade-nation.com',
    'iribo@nomade-nation.com'
);

-- Crear solo los usuarios que faltan
DO $$
DECLARE
    user_data RECORD;
    new_user_id UUID;
BEGIN
    -- Solo crear los 3 usuarios faltantes
    FOR user_data IN 
        SELECT * FROM (VALUES 
            ('youssef@nomade-nation.com', 'Youssef2022$', 'Youssef', 'Comercial'),
            ('elizza@nomade-nation.com', 'Elena2022$', 'Elena Lizza', 'Dir. Customer'),
            ('msanz@nomade-nation.com', 'Marina2022$', 'Marina Sanz', 'Dir. Marketing')
        ) AS t(email, password, name, department)
    LOOP
        new_user_id := gen_random_uuid();
        
        -- Crear usuario en auth.users
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
    END LOOP;
END $$;