-- Primero actualizar contraseñas de usuarios existentes
UPDATE auth.users SET 
    encrypted_password = CASE 
        WHEN email = 'mescude@nomade-nation.com' THEN crypt('Marc2022$', gen_salt('bf'))
        WHEN email = 'amirallas@nomade-nation.com' THEN crypt('Arnau2022$', gen_salt('bf'))
        WHEN email = 'iribo@nomade-nation.com' THEN crypt('628310145', gen_salt('bf'))
        ELSE encrypted_password
    END,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email IN ('mescude@nomade-nation.com', 'amirallas@nomade-nation.com', 'iribo@nomade-nation.com');

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
WHERE email IN ('mescude@nomade-nation.com', 'amirallas@nomade-nation.com', 'iribo@nomade-nation.com');