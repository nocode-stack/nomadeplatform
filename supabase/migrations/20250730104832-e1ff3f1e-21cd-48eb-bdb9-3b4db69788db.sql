-- Crear usuarios usando las funciones administrativas de Supabase
-- Solo los insertar si no existen ya

DO $$
DECLARE
    user_id uuid;
BEGIN
    -- mescude@nomade-nation.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mescude@nomade-nation.com') THEN
        user_id := gen_random_uuid();
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
            user_id,
            '00000000-0000-0000-0000-000000000000',
            'mescude@nomade-nation.com',
            crypt('Marc2022$', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Marc Escude", "department": "CFO"}',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO public.user_profiles (user_id, name, email, department)
        VALUES (user_id, 'Marc Escude', 'mescude@nomade-nation.com', 'CFO');
    END IF;

    -- amirallas@nomade-nation.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'amirallas@nomade-nation.com') THEN
        user_id := gen_random_uuid();
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
            user_id,
            '00000000-0000-0000-0000-000000000000',
            'amirallas@nomade-nation.com',
            crypt('Arnau2022$', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Arnau Mirallas", "department": "Comercial"}',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO public.user_profiles (user_id, name, email, department)
        VALUES (user_id, 'Arnau Mirallas', 'amirallas@nomade-nation.com', 'Comercial');
    END IF;

    -- youssef@nomade-nation.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'youssef@nomade-nation.com') THEN
        user_id := gen_random_uuid();
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
            user_id,
            '00000000-0000-0000-0000-000000000000',
            'youssef@nomade-nation.com',
            crypt('Youssef2022$', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Youssef", "department": "Comercial"}',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO public.user_profiles (user_id, name, email, department)
        VALUES (user_id, 'Youssef', 'youssef@nomade-nation.com', 'Comercial');
    END IF;

    -- elizza@nomade-nation.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'elizza@nomade-nation.com') THEN
        user_id := gen_random_uuid();
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
            user_id,
            '00000000-0000-0000-0000-000000000000',
            'elizza@nomade-nation.com',
            crypt('Elena2022$', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Elena Lizza", "department": "Dir. Customer"}',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO public.user_profiles (user_id, name, email, department)
        VALUES (user_id, 'Elena Lizza', 'elizza@nomade-nation.com', 'Dir. Customer');
    END IF;

    -- msanz@nomade-nation.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'msanz@nomade-nation.com') THEN
        user_id := gen_random_uuid();
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
            user_id,
            '00000000-0000-0000-0000-000000000000',
            'msanz@nomade-nation.com',
            crypt('Marina2022$', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Marina Sanz", "department": "Dir. Marketing"}',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO public.user_profiles (user_id, name, email, department)
        VALUES (user_id, 'Marina Sanz', 'msanz@nomade-nation.com', 'Dir. Marketing');
    END IF;

    -- iribo@nomade-nation.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'iribo@nomade-nation.com') THEN
        user_id := gen_random_uuid();
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
            user_id,
            '00000000-0000-0000-0000-000000000000',
            'iribo@nomade-nation.com',
            crypt('628310145', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Ivan Ribo", "department": "CEO"}',
            'authenticated',
            'authenticated'
        );
        
        INSERT INTO public.user_profiles (user_id, name, email, department)
        VALUES (user_id, 'Ivan Ribo', 'iribo@nomade-nation.com', 'CEO');
    END IF;

END $$;