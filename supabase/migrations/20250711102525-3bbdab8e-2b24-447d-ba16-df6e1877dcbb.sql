-- Corregir la foreign key para que NEW_Comments apunte a NEW_Projects
ALTER TABLE public."NEW_Comments" 
DROP CONSTRAINT IF EXISTS "NEW_Comments_project_id_fkey";

-- Crear la foreign key correcta hacia NEW_Projects
ALTER TABLE public."NEW_Comments" 
ADD CONSTRAINT "NEW_Comments_project_id_fkey" 
FOREIGN KEY (project_id) REFERENCES public."NEW_Projects"(id) ON DELETE CASCADE;