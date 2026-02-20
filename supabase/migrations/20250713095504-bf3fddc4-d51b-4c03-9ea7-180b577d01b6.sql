-- CREAR VISTA PARA CONSULTAS UNIFICADAS DE PROYECTOS
CREATE OR REPLACE VIEW project_assignments_status AS
SELECT 
  p.id as project_id,
  p.project_code,
  p.client_id,
  c.name as client_name,
  c.client_code,
  p.slot_id,
  ps.production_code as slot_production_code,
  ps.start_date as slot_start_date,
  ps.end_date as slot_end_date,
  p.vehicle_id,
  v.vehicle_code,
  v.numero_bastidor,
  v.matricula,
  -- Estados de sincronización
  CASE 
    WHEN p.slot_id IS NOT NULL AND ps.project_id = p.id THEN true
    WHEN p.slot_id IS NULL THEN null
    ELSE false
  END as slot_synced,
  CASE 
    WHEN p.vehicle_id IS NOT NULL AND v.project_id = p.id THEN true
    WHEN p.vehicle_id IS NULL THEN null
    ELSE false
  END as vehicle_synced,
  -- Estado general
  CASE 
    WHEN (p.slot_id IS NULL OR ps.project_id = p.id) AND 
         (p.vehicle_id IS NULL OR v.project_id = p.id) THEN 'OK'
    ELSE 'DESINCRONIZADO'
  END as sync_status,
  p.status as project_status,
  p.created_at,
  p.updated_at
FROM "NEW_Projects" p
LEFT JOIN "NEW_Clients" c ON p.client_id = c.id
LEFT JOIN "NEW_Production_Schedule" ps ON p.slot_id = ps.id
LEFT JOIN "NEW_Vehicles" v ON p.vehicle_id = v.id;