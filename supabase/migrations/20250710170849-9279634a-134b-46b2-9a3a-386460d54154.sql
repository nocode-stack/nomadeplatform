-- Limpiar datos huérfanos y luego crear las relaciones correctas

-- 1. Identificar y limpiar projects que referencian clients inexistentes
UPDATE public.projects 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
AND client_id NOT IN (SELECT id FROM public.clients);

-- 2. Ahora crear la foreign key correctamente
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_client_id_fkey;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_new_projects_client_id ON public.NEW_Projects(client_id);
CREATE INDEX IF NOT EXISTS idx_new_projects_project_code ON public.NEW_Projects(project_code);

-- 4. Habilitar RLS en NEW_Projects
ALTER TABLE public.NEW_Projects ENABLE ROW LEVEL SECURITY;

-- 5. Crear política para NEW_Projects
DROP POLICY IF EXISTS "Enable all access for now" ON public.NEW_Projects;
CREATE POLICY "Enable all access for now" ON public.NEW_Projects
FOR ALL 
USING (true)
WITH CHECK (true);