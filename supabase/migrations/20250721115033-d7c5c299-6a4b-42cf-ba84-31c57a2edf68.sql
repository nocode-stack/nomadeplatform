
-- Paso 1: Corregir datos existentes - Actualizar proyectos con clientes que son 'client' pero proyecto sigue como 'prospect'
UPDATE public."NEW_Projects" 
SET status = 'pre_production'
WHERE id IN (
  SELECT p.id 
  FROM public."NEW_Projects" p 
  JOIN public."NEW_Clients" c ON p.client_id = c.id 
  WHERE c.client_status = 'client' 
  AND p.status = 'prospect'
);

-- Paso 2: Crear función mejorada para sincronización completa
CREATE OR REPLACE FUNCTION public.sync_project_status_with_client()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Para INSERT: Si se crea un cliente directamente como 'client', actualizar proyecto existente
  IF TG_OP = 'INSERT' AND NEW.client_status = 'client' THEN
    -- Verificar si ya existe un proyecto para este cliente
    UPDATE public."NEW_Projects"
    SET 
      status = 'pre_production',
      project_code = CASE 
        WHEN project_code IS NULL OR project_code = '' 
        THEN generate_project_code() 
        ELSE project_code 
      END,
      updated_at = now()
    WHERE client_id = NEW.id
    AND status = 'prospect';
  END IF;
  
  -- Para UPDATE: Lógica existente cuando se convierte de prospect a client
  IF TG_OP = 'UPDATE' AND OLD.client_status = 'prospect' AND NEW.client_status = 'client' THEN
    -- Verificar si ya existe un proyecto para este cliente
    UPDATE public."NEW_Projects"
    SET 
      status = 'pre_production',
      project_code = CASE 
        WHEN project_code IS NULL OR project_code = '' 
        THEN generate_project_code() 
        ELSE project_code 
      END,
      updated_at = now()
    WHERE client_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Paso 3: Reemplazar el trigger existente
DROP TRIGGER IF EXISTS create_project_on_client_conversion_trigger ON public."NEW_Clients";
CREATE TRIGGER sync_project_status_with_client_trigger
  AFTER INSERT OR UPDATE ON public."NEW_Clients"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_status_with_client();

-- Paso 4: Crear función para sincronización manual (por si se necesita en el futuro)
CREATE OR REPLACE FUNCTION public.sync_all_project_statuses()
RETURNS TABLE(
  project_id uuid,
  project_code text,
  old_status text,
  new_status text,
  action text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH updates AS (
    UPDATE public."NEW_Projects" 
    SET status = 'pre_production'
    WHERE id IN (
      SELECT p.id 
      FROM public."NEW_Projects" p 
      JOIN public."NEW_Clients" c ON p.client_id = c.id 
      WHERE c.client_status = 'client' 
      AND p.status = 'prospect'
    )
    RETURNING id, project_code, 'prospect' as old_status, 'pre_production' as new_status, 'SYNCHRONIZED' as action
  )
  SELECT u.id, u.project_code, u.old_status, u.new_status, u.action FROM updates u;
END;
$$;

-- Paso 5: Verificar el resultado
SELECT 
  p.project_code,
  p.status as project_status,
  c.client_status,
  c.name as client_name,
  CASE 
    WHEN c.client_status = 'client' AND p.status = 'prospect' THEN 'INCONSISTENT'
    WHEN c.client_status = 'prospect' AND p.status = 'prospect' THEN 'CONSISTENT'
    WHEN c.client_status = 'client' AND p.status = 'pre_production' THEN 'CONSISTENT'
    ELSE 'OTHER'
  END as consistency_status
FROM public."NEW_Projects" p
JOIN public."NEW_Clients" c ON p.client_id = c.id
WHERE p.project_code IS NOT NULL
ORDER BY p.created_at DESC;
