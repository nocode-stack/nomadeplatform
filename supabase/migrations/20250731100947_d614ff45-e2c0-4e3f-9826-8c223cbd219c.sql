-- Crear los 3 usuarios faltantes uno por uno

-- Usuario 1: Youssef
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
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'youssef@nomade-nation.com',
    crypt('Youssef2022$', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

-- Usuario 2: Elena
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
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'elizza@nomade-nation.com',
    crypt('Elena2022$', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

-- Usuario 3: Marina
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
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'msanz@nomade-nation.com',
    crypt('Marina2022$', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    ''
);

-- Crear perfiles correspondientes
INSERT INTO public.user_profiles (id, user_id, email, name, department, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    au.id,
    au.email,
    CASE 
        WHEN au.email = 'youssef@nomade-nation.com' THEN 'Youssef'
        WHEN au.email = 'elizza@nomade-nation.com' THEN 'Elena Lizza'
        WHEN au.email = 'msanz@nomade-nation.com' THEN 'Marina Sanz'
    END,
    CASE 
        WHEN au.email = 'youssef@nomade-nation.com' THEN 'Comercial'
        WHEN au.email = 'elizza@nomade-nation.com' THEN 'Dir. Customer'
        WHEN au.email = 'msanz@nomade-nation.com' THEN 'Dir. Marketing'
    END,
    now(),
    now()
FROM auth.users au
WHERE au.email IN ('youssef@nomade-nation.com', 'elizza@nomade-nation.com', 'msanz@nomade-nation.com')
AND NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = au.id);