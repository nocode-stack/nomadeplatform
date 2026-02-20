-- Actualizar reglas de precios para sistemas eléctricos con packs Adventure/Ultimate
-- Litio: gratis con Adventure/Ultimate (sin cambios)
-- Litio+: precio final 1.210€ con IVA = 1000€ sin IVA
-- Pro: precio final 1.810€ con IVA = 1495.87€ sin IVA

UPDATE "NEW_Budget_Electric" 
SET pack_pricing_rules = jsonb_build_object(
  'Adventure', jsonb_build_object(
    'type', 'fixed_price',
    'amount', 1000.00,
    'reason', 'Precio especial con pack Adventure'
  ),
  'Ultimate', jsonb_build_object(
    'type', 'fixed_price', 
    'amount', 1000.00,
    'reason', 'Precio especial con pack Ultimate'
  )
)
WHERE name = 'Litio+';

UPDATE "NEW_Budget_Electric"
SET pack_pricing_rules = jsonb_build_object(
  'Adventure', jsonb_build_object(
    'type', 'fixed_price',
    'amount', 1495.87,
    'reason', 'Precio especial con pack Adventure'
  ),
  'Ultimate', jsonb_build_object(
    'type', 'fixed_price',
    'amount', 1495.87, 
    'reason', 'Precio especial con pack Ultimate'
  )
)
WHERE name = 'Pro';