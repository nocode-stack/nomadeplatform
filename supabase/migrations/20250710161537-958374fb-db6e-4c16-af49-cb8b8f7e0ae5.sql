-- Migrar NEW_Clients para usar UUID en lugar de bigint
-- Primero, crear una nueva columna UUID
ALTER TABLE public.NEW_Clients ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- Actualizar la nueva columna para todos los registros existentes
UPDATE public.NEW_Clients SET new_id = gen_random_uuid() WHERE new_id IS NULL;

-- Hacer que la nueva columna no sea nullable
ALTER TABLE public.NEW_Clients ALTER COLUMN new_id SET NOT NULL;

-- Eliminar la columna id antigua
ALTER TABLE public.NEW_Clients DROP COLUMN id;

-- Renombrar la nueva columna a id
ALTER TABLE public.NEW_Clients RENAME COLUMN new_id TO id;

-- Agregar la restricción de clave primaria
ALTER TABLE public.NEW_Clients ADD PRIMARY KEY (id);

-- Actualizar los proyectos para que apunten a los nuevos UUIDs
-- Primero, necesitamos crear una tabla temporal para mapear los IDs antiguos a los nuevos
-- Como ya perdimos la referencia anterior, vamos a limpiar las referencias en projects
UPDATE public.projects SET client_id = NULL WHERE client_id IS NOT NULL;