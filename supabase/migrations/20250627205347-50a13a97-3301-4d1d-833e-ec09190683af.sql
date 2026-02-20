
-- Agregar la columna 'extras' que falta en la tabla projects
ALTER TABLE public.projects ADD COLUMN extras TEXT;

-- También agregar la columna 'pack' que se usa en el código pero no existe
ALTER TABLE public.projects ADD COLUMN pack TEXT;
