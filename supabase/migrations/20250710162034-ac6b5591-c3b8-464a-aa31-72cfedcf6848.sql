-- Actualizar la vista project_with_budget_data para usar NEW_Clients en lugar de clients
DROP VIEW IF EXISTS public.project_with_budget_data;

CREATE VIEW public.project_with_budget_data AS
SELECT 
  p.*,
  b.id as budget_id,
  b.budget_number,
  b.status as budget_status,
  b.total as budget_total,
  vo.name as vehicle_option_name,
  vo.power as budget_power,
  vo.transmission as budget_transmission,
  -- Campos efectivos que priorizan datos del presupuesto
  COALESCE(vo.name, p.model) as effective_model,
  COALESCE(
    (SELECT name FROM interior_color_options WHERE name = ANY(
      SELECT jsonb_array_elements_text(
        CASE 
          WHEN bi.name LIKE '%Interior%' THEN 
            CASE 
              WHEN jsonb_typeof(bi.removed_components) = 'array' THEN 
                (SELECT jsonb_agg(value) FROM jsonb_array_elements_text(bi.removed_components) WHERE value NOT LIKE '%Interior%')
              ELSE '[]'::jsonb
            END
          ELSE '[]'::jsonb
        END
      )
      FROM budget_items bi 
      WHERE bi.budget_id = b.id AND bi.category = 'interior_color'
      LIMIT 1
    )),
    p.interior_color
  ) as effective_interior_color,
  COALESCE(vo.power, p.power) as effective_power,
  COALESCE(
    (SELECT name FROM budget_packs WHERE id = (
      SELECT pack_id FROM budget_items 
      WHERE budget_id = b.id AND pack_id IS NOT NULL 
      LIMIT 1
    )),
    p.pack
  ) as effective_pack,
  COALESCE(
    (SELECT name FROM electric_systems WHERE name = ANY(
      SELECT bi.name FROM budget_items bi 
      WHERE bi.budget_id = b.id AND bi.category = 'electric_system'
      LIMIT 1
    )),
    p.electric_system
  ) as effective_electric_system,
  COALESCE(
    (SELECT string_agg(bi.name, ', ') FROM budget_items bi 
     WHERE bi.budget_id = b.id AND bi.category = 'extras'),
    p.extras
  ) as effective_extras
FROM public.projects p
LEFT JOIN public.budgets b ON b.project_id = p.id
LEFT JOIN public.vehicle_options vo ON vo.id = b.vehicle_option_id;