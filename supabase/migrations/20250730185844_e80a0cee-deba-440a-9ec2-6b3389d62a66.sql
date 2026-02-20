-- Limpiar y crear usuarios corporativos
-- Primero verificar y actualizar usuarios existentes

DO $$
DECLARE
    user_record RECORD;
    target_user_id uuid;
BEGIN
    -- Usuarios a crear/actualizar con sus contraseñas
    FOR user_record IN 
        SELECT * FROM (VALUES 
            ('mescude@nomade-nation.com', 'Marc2022$', 'Marc Escude', 'CFO'),
            ('amirallas@nomade-nation.com', 'Arnau2022$', 'Arnau Mirallas', 'Comercial'),
            ('youssef@nomade-nation.com', 'Youssef2022$', 'Youssef', 'Comercial'),
            ('elizza@nomade-nation.com', 'Elena2022$', 'Elena Lizza', 'Dir. Customer'),
            ('msanz@nomade-nation.com', 'Marina2022$', 'Marina Sanz', 'Dir. Marketing'),
            ('iribo@nomade-nation.com', '628310145', 'Ivan Ribo', 'CEO')
        ) AS t(email, password, name, department)
    LOOP
        -- Verificar si el usuario ya existe
        SELECT id INTO target_user_id FROM auth.users WHERE email = user_record.email;
        
        IF target_user_id IS NOT NULL THEN
            -- Usuario existe, actualizar contraseña y metadata
            UPDATE auth.users SET 
                encrypted_password = crypt(user_record.password, gen_salt('bf')),
                email_confirmed_at = COALESCE(email_confirmed_at, now()),
                raw_user_meta_data = jsonb_build_object(
                    'name', user_record.name,
                    'department', user_record.department
                ),
                updated_at = now()
            WHERE id = target_user_id;
            
            -- Actualizar o crear perfil
            INSERT INTO public.user_profiles (user_id, name, email, department)
            VALUES (target_user_id, user_record.name, user_record.email, user_record.department)
            ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                department = EXCLUDED.department,
                updated_at = now();
        ELSE
            -- Usuario no existe, crear nuevo
            target_user_id := gen_random_uuid();
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                role,
                aud
            ) VALUES (
                target_user_id,
                '00000000-0000-0000-0000-000000000000',
                user_record.email,
                crypt(user_record.password, gen_salt('bf')),
                now(),
                now(),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('name', user_record.name, 'department', user_record.department),
                'authenticated',
                'authenticated'
            );
            
            -- Crear perfil
            INSERT INTO public.user_profiles (user_id, name, email, department)
            VALUES (target_user_id, user_record.name, user_record.email, user_record.department);
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Usuarios corporativos creados/actualizados correctamente';
END $$;