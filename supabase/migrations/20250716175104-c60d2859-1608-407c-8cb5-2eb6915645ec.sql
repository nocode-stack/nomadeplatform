-- Añadir campo para el logo en la tabla de información de empresa
ALTER TABLE public."NEW_Nomade_Info" 
ADD COLUMN logo_url TEXT DEFAULT NULL;

-- Actualizar con la URL del logo
UPDATE public."NEW_Nomade_Info" 
SET logo_url = '/lovable-uploads/4a0d6b75-aa97-40ba-a88d-3e6e47a902b6.png'
WHERE is_active = true;