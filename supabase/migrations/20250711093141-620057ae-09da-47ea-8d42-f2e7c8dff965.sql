-- Arreglar las foreign keys entre NEW_Incidents y projects
ALTER TABLE public."NEW_Incidents" 
DROP CONSTRAINT IF EXISTS incidents_project_id_fkey;

ALTER TABLE public."NEW_Incidents" 
DROP CONSTRAINT IF EXISTS "NEW_Incidents_project_id_fkey";

-- Crear la foreign key correcta hacia projects (no NEW_Projects)
ALTER TABLE public."NEW_Incidents" 
ADD CONSTRAINT "NEW_Incidents_project_id_fkey" 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Verificar que NEW_Incident_Items tenga la foreign key correcta
ALTER TABLE public."NEW_Incident_Items" 
DROP CONSTRAINT IF EXISTS incident_items_incident_id_fkey;

ALTER TABLE public."NEW_Incident_Items" 
ADD CONSTRAINT "NEW_Incident_Items_incident_id_fkey" 
FOREIGN KEY (incident_id) REFERENCES public."NEW_Incidents"(id) ON DELETE CASCADE;