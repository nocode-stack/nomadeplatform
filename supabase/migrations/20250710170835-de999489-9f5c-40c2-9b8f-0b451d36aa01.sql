-- Arreglar relaciones entre tablas projects, clients y NEW_Projects

-- 1. Verificar y arreglar la foreign key de projects a clients
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_client_id_fkey;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- 2. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_new_projects_client_id ON public.NEW_Projects(client_id);
CREATE INDEX IF NOT EXISTS idx_new_projects_project_code ON public.NEW_Projects(project_code);

-- 3. Habilitar RLS en NEW_Projects si no está habilitado
ALTER TABLE public.NEW_Projects ENABLE ROW LEVEL SECURITY;

-- 4. Crear política para NEW_Projects
DROP POLICY IF EXISTS "Enable all access for now" ON public.NEW_Projects;
CREATE POLICY "Enable all access for now" ON public.NEW_Projects
FOR ALL 
USING (true)
WITH CHECK (true);