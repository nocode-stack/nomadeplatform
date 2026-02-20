-- Investigar la estructura de auth.users para entender el problema
-- Intentar arreglar las columnas NULL problemáticas en auth.users

-- Actualizamos las columnas problemáticas que causan el error de scan
-- ADVERTENCIA: Solo hacemos esto en development, nunca en producción normal
UPDATE auth.users 
SET 
  email_change = '',
  email_change_sent_at = NULL,
  email_change_confirm_status = 0
WHERE email_change IS NULL 
  AND email LIKE '%@nomade-nation.com';

-- También asegurémonos de que otras columnas problemáticas estén bien
UPDATE auth.users 
SET 
  phone_change = '',
  phone_change_sent_at = NULL
WHERE phone_change IS NULL 
  AND email LIKE '%@nomade-nation.com';