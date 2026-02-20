-- Arreglar la inconsistencia de datos en user_profiles
-- Actualizar el email en user_profiles para que coincida con auth.users

UPDATE user_profiles 
SET email = 'iribo@nomade-nation.com',
    updated_at = now()
WHERE user_id = 'b0fdbf16-61ba-41aa-87b1-29994150b6a2' 
AND email = 'gfgf@fm.me';

-- Verificar que no hay otros emails inconsistentes
-- Actualizar todos los emails en user_profiles para que coincidan con auth.users
UPDATE user_profiles 
SET email = au.email,
    updated_at = now()
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
AND user_profiles.email != au.email;