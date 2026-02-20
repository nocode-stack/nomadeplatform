-- Reconectar proyectos con clientes usando los datos de presupuestos
-- Actualizar el proyecto de Mireia Ribó
UPDATE projects 
SET client_id = 'c282061f-9a40-4b92-a574-04f0d380cb4c'
WHERE id = 'cae29506-faaf-48dd-81bc-a74f9bc4ee52';

-- Reconectar otros proyectos basándose en coincidencias de nombres
UPDATE projects 
SET client_id = (
  SELECT nc.id 
  FROM "NEW_Clients" nc 
  JOIN budgets b ON LOWER(TRIM(b.client_name)) = LOWER(TRIM(nc.name))
  WHERE b.project_id = projects.id 
  LIMIT 1
)
WHERE client_id IS NULL 
AND EXISTS (
  SELECT 1 FROM budgets b 
  WHERE b.project_id = projects.id 
  AND b.client_name IS NOT NULL
);