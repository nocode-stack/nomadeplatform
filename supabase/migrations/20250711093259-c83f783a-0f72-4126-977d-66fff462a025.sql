-- Corregir la foreign key para que NEW_Incidents apunte a NEW_Projects
ALTER TABLE public."NEW_Incidents" 
DROP CONSTRAINT IF EXISTS "NEW_Incidents_project_id_fkey";

-- Crear la foreign key correcta hacia NEW_Projects
ALTER TABLE public."NEW_Incidents" 
ADD CONSTRAINT "NEW_Incidents_project_id_fkey" 
FOREIGN KEY (project_id) REFERENCES public."NEW_Projects"(id) ON DELETE CASCADE;