-- Corregir estados inconsistentes de proyectos
-- Los proyectos con clientes (no prospects) deberían tener status 'pre_production' o superior

-- Primero, veamos los datos inconsistentes
SELECT 
  p.id,
  p.project_code,
  p.status as project_status,
  c.client_status,
  c.name as client_name
FROM public."NEW_Projects" p
JOIN public."NEW_Clients" c ON p.client_id = c.id
WHERE c.client_status = 'client' AND p.status = 'prospect';

-- Actualizar proyectos de clientes que siguen con status 'prospect'
UPDATE public."NEW_Projects" 
SET status = 'pre_production'
WHERE id IN (
  SELECT p.id 
  FROM public."NEW_Projects" p
  JOIN public."NEW_Clients" c ON p.client_id = c.id
  WHERE c.client_status = 'client' AND p.status = 'prospect'
);

-- Verificar el resultado
SELECT 
  c.client_status,
  p.status as project_status,
  COUNT(*) as count
FROM public."NEW_Projects" p
JOIN public."NEW_Clients" c ON p.client_id = c.id
GROUP BY c.client_status, p.status
ORDER BY c.client_status, p.status;