-- Eliminar la columna 'name' de NEW_Projects que está causando confusión
-- Ya tenemos project_code y client_name que son más útiles y descriptivos

ALTER TABLE public."NEW_Projects" 
DROP COLUMN IF EXISTS name;