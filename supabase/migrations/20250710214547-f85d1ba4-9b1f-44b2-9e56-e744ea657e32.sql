-- Eliminar la foreign key existente de NEW_Projects hacia NEW_Clients y recrearla con CASCADE
ALTER TABLE public."NEW_Projects" 
DROP CONSTRAINT IF EXISTS "NEW_Projects_client_id_fkey";

-- Recrear la foreign key con ON DELETE CASCADE para que al eliminar un cliente se eliminen sus proyectos
ALTER TABLE public."NEW_Projects" 
ADD CONSTRAINT "NEW_Projects_client_id_fkey" 
FOREIGN KEY (client_id) 
REFERENCES public."NEW_Clients"(id) 
ON DELETE CASCADE;