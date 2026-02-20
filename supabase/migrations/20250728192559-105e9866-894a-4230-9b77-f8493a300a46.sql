-- Crear usuarios en auth.users con las contraseñas especificadas
-- Nota: Los usuarios se crearán directamente en la tabla auth.users con email confirmado

-- Insertar usuarios corporativos
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_sent_at
) VALUES 
-- mescude@nomade-nation.com - Marc2022$
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'mescude@nomade-nation.com',
  crypt('Marc2022$', gen_salt('bf')),
  now(),
  null,
  '',
  '',
  '',
  '',
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Marc Escude", "department": "CFO"}',
  false,
  'authenticated',
  'authenticated',
  now()
),
-- amirallas@nomade-nation.com - Arnau2022$
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'amirallas@nomade-nation.com',
  crypt('Arnau2022$', gen_salt('bf')),
  now(),
  null,
  '',
  '',
  '',
  '',
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Arnau Mirallas", "department": "Comercial"}',
  false,
  'authenticated',
  'authenticated',
  now()
),
-- youssef@nomade-nation.com - Youssef2022$
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'youssef@nomade-nation.com',
  crypt('Youssef2022$', gen_salt('bf')),
  now(),
  null,
  '',
  '',
  '',
  '',
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Youssef", "department": "Comercial"}',
  false,
  'authenticated',
  'authenticated',
  now()
),
-- elizza@nomade-nation.com - Elena2022$
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'elizza@nomade-nation.com',
  crypt('Elena2022$', gen_salt('bf')),
  now(),
  null,
  '',
  '',
  '',
  '',
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Elena Lizza", "department": "Dir. Customer"}',
  false,
  'authenticated',
  'authenticated',
  now()
),
-- msanz@nomade-nation.com - Marina2022$
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'msanz@nomade-nation.com',
  crypt('Marina2022$', gen_salt('bf')),
  now(),
  null,
  '',
  '',
  '',
  '',
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Marina Sanz", "department": "Dir. Marketing"}',
  false,
  'authenticated',
  'authenticated',
  now()
),
-- iribo@nomade-nation.com - 628310145
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'iribo@nomade-nation.com',
  crypt('628310145', gen_salt('bf')),
  now(),
  null,
  '',
  '',
  '',
  '',
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Ivan Ribo", "department": "CEO"}',
  false,
  'authenticated',
  'authenticated',
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Crear perfiles de usuario correspondientes en user_profiles
INSERT INTO public.user_profiles (
  user_id,
  name,
  email,
  department
)
SELECT 
  au.id,
  au.raw_user_meta_data->>'name',
  au.email,
  au.raw_user_meta_data->>'department'
FROM auth.users au
WHERE au.email IN (
  'mescude@nomade-nation.com',
  'amirallas@nomade-nation.com', 
  'youssef@nomade-nation.com',
  'elizza@nomade-nation.com',
  'msanz@nomade-nation.com',
  'iribo@nomade-nation.com'
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  department = EXCLUDED.department;