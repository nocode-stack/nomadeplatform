-- FUNCIÓN DE UTILIDAD PARA VERIFICAR Y REPARAR INCONSISTENCIAS
CREATE OR REPLACE FUNCTION sync_all_project_assignments()
RETURNS TABLE(
  action_type text,
  project_code text,
  details text
) AS $$
BEGIN
  -- Sincronizar slots huérfanos (sin project_id pero referenciados en NEW_Projects)
  UPDATE "NEW_Production_Schedule" ps
  SET project_id = p.id
  FROM "NEW_Projects" p 
  WHERE p.slot_id = ps.id 
  AND ps.project_id IS NULL;
  
  IF FOUND THEN
    RETURN QUERY 
    SELECT 
      'SLOT_SYNC'::text,
      p.project_code,
      'Slot sincronizado con proyecto'::text
    FROM "NEW_Projects" p
    JOIN "NEW_Production_Schedule" ps ON p.slot_id = ps.id
    WHERE ps.project_id = p.id;
  END IF;
  
  -- Sincronizar vehículos huérfanos (sin project_id pero referenciados en NEW_Projects)
  UPDATE "NEW_Vehicles" v
  SET project_id = p.id
  FROM "NEW_Projects" p 
  WHERE p.vehicle_id = v.id 
  AND v.project_id IS NULL;
  
  IF FOUND THEN
    RETURN QUERY 
    SELECT 
      'VEHICLE_SYNC'::text,
      p.project_code,
      'Vehículo sincronizado con proyecto'::text
    FROM "NEW_Projects" p
    JOIN "NEW_Vehicles" v ON p.vehicle_id = v.id
    WHERE v.project_id = p.id;
  END IF;
  
  -- Limpiar referencias de slots que no existen
  UPDATE "NEW_Projects" 
  SET slot_id = NULL 
  WHERE slot_id IS NOT NULL 
  AND slot_id NOT IN (SELECT id FROM "NEW_Production_Schedule");
  
  -- Limpiar referencias de vehículos que no existen
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
$$ LANGUAGE plpgsql;