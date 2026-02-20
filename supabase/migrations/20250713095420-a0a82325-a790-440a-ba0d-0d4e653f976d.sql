-- Corregir función con permisos SECURITY DEFINER
CREATE OR REPLACE FUNCTION sync_all_project_assignments()
RETURNS TABLE(
  action_type text,
  project_code text,
  details text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sincronizar slots huérfanos (sin project_id pero referenciados en NEW_Projects)
  UPDATE "NEW_Production_Schedule" ps
  SET project_id = p.id
  FROM "NEW_Projects" p 
  WHERE p.slot_id = ps.id 
  AND ps.project_id IS NULL;
  
  -- Sincronizar vehículos huérfanos (sin project_id pero referenciados en NEW_Projects)
  UPDATE "NEW_Vehicles" v
  SET project_id = p.id
  FROM "NEW_Projects" p 
  WHERE p.vehicle_id = v.id 
  AND v.project_id IS NULL;
  
  -- Limpiar referencias rotas
  UPDATE "NEW_Projects" 
  SET slot_id = NULL 
  WHERE slot_id IS NOT NULL 
  AND slot_id NOT IN (SELECT id FROM "NEW_Production_Schedule");
  
  UPDATE "NEW_Projects" 
  SET vehicle_id = NULL 
  WHERE vehicle_id IS NOT NULL 
  AND vehicle_id NOT IN (SELECT id FROM "NEW_Vehicles");
  
  RETURN QUERY 
  SELECT 
    'CLEANUP_COMPLETE'::text,
    'ALL'::text,
    'Sincronización completa finalizada'::text;
END;
$$;