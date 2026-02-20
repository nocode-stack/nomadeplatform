-- Paso 1: Limpieza total de conexiones vehículo-proyecto
-- Limpiar todas las referencias bidireccionales para empezar desde cero

-- Limpiar project_id en NEW_Vehicles
UPDATE "NEW_Vehicles" SET project_id = NULL WHERE project_id IS NOT NULL;

-- Limpiar vehicle_id en NEW_Projects
UPDATE "NEW_Projects" SET vehicle_id = NULL WHERE vehicle_id IS NOT NULL;

-- Limpiar project_id en vehicles (tabla antigua)
UPDATE vehicles SET project_id = NULL WHERE project_id IS NOT NULL;

-- Limpiar vehicle_id en projects (tabla antigua)
UPDATE projects SET vehicle_id = NULL WHERE vehicle_id IS NOT NULL;

-- Comentario: Ahora todas las tablas están en estado limpio sin conexiones vehículo-proyecto