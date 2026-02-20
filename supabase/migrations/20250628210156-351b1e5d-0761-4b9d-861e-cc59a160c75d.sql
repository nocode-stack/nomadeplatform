
-- Primero, agregar una columna temporal para la migración
ALTER TABLE projects ADD COLUMN status_temp text;

-- Migrar los datos existentes a la columna temporal
UPDATE projects SET status_temp = 
  CASE 
    WHEN status::text = 'draft' THEN 'prospect'
    WHEN status::text = 'confirmed' THEN 'pre_production'
    WHEN status::text = 'pre_production' THEN 'pre_production'
    WHEN status::text = 'in_production' THEN 'production'
    WHEN status::text = 'quality_control' THEN 'production'
    WHEN status::text = 'reworks' THEN 'reworks'
    WHEN status::text = 'packaging' THEN 'pre_delivery'
    WHEN status::text = 'delivery' THEN 'delivered'
    WHEN status::text = 'completed' THEN 'delivered'
    WHEN status::text = 'cancelled' THEN 'delivered'
    WHEN status::text = 'on_hold' THEN 'prospect'
    ELSE 'prospect'
  END;

-- Crear el nuevo ENUM con los 7 estados simplificados
CREATE TYPE project_status_new AS ENUM (
  'prospect',
  'pre_production', 
  'production',
  'reworks',
  'pre_delivery',
  'delivered',
  'repair'
);

-- Eliminar la columna status actual
ALTER TABLE projects DROP COLUMN status;

-- Renombrar la columna temporal a status y aplicar el nuevo tipo
ALTER TABLE projects RENAME COLUMN status_temp TO status;
ALTER TABLE projects ALTER COLUMN status TYPE project_status_new USING status::project_status_new;

-- Eliminar el ENUM antiguo y renombrar el nuevo
DROP TYPE project_status;
ALTER TYPE project_status_new RENAME TO project_status;
