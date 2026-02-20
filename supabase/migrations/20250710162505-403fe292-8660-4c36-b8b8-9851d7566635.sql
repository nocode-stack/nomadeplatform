-- Primero eliminar la foreign key antigua que apunta a clients
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;

-- Ahora crear la nueva foreign key que apunta a NEW_Clients
ALTER TABLE public.projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public."NEW_Clients"(id) ON DELETE SET NULL;