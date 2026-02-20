
-- Agregar restricción para permitir solo un presupuesto por proyecto
ALTER TABLE budgets ADD CONSTRAINT unique_budget_per_project UNIQUE (project_id);

-- Crear un índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);

-- Crear una vista que combine los datos del proyecto con su presupuesto
CREATE OR REPLACE VIEW project_with_budget_data AS
SELECT 
  p.*,
  b.id as budget_id,
  b.budget_number,
  b.status as budget_status,
  b.total as budget_total,
  b.vehicle_option_id,
  vo.name as vehicle_option_name,
  vo.power as budget_power,
  vo.transmission as budget_transmission,
  -- Extraer datos del presupuesto para reemplazar campos del proyecto
  COALESCE(
    (SELECT bi.name FROM budget_items bi WHERE bi.budget_id = b.id AND bi.category = 'modelo' LIMIT 1), 
    p.model
  ) as effective_model,
  COALESCE(
    (SELECT bi.name FROM budget_items bi WHERE bi.budget_id = b.id AND bi.category = 'color_interior' LIMIT 1), 
    p.interior_color
  ) as effective_interior_color,
  COALESCE(
    (SELECT vo.power FROM budget_items bi 
     JOIN vehicle_options vo ON bi.name = vo.name 
     WHERE bi.budget_id = b.id AND bi.category = 'base' LIMIT 1), 
    p.power
  ) as effective_power,
  COALESCE(
    (SELECT string_agg(bi.name, ', ') FROM budget_items bi WHERE bi.budget_id = b.id AND bi.category = 'pack'), 
    p.pack
  ) as effective_pack,
  COALESCE(
    (SELECT bi.name FROM budget_items bi WHERE bi.budget_id = b.id AND bi.category = 'sistema_electrico' LIMIT 1), 
    p.electric_system
  ) as effective_electric_system,
  COALESCE(
    (SELECT string_agg(bi.name, ', ') FROM budget_items bi WHERE bi.budget_id = b.id AND bi.category = 'opcionales'), 
    p.extras
  ) as effective_extras
FROM projects p
LEFT JOIN budgets b ON p.id = b.project_id
LEFT JOIN vehicle_options vo ON b.vehicle_option_id = vo.id;
