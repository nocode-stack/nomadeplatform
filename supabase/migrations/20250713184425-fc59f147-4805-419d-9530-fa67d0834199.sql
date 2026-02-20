-- Actualizar precios de motores
UPDATE engine_options 
SET price_modifier = 55785.12 
WHERE name ILIKE '%140%' OR power ILIKE '%140%';

UPDATE engine_options 
SET price_modifier = 59090.91 
WHERE name ILIKE '%180%' OR power ILIKE '%180%';

-- Actualizar precios de packs
UPDATE "NEW_Budget_Packs" 
SET price = 1239.67 
WHERE name ILIKE '%essential%';

UPDATE "NEW_Budget_Packs" 
SET price = 3305.79 
WHERE name ILIKE '%adventure%';

UPDATE "NEW_Budget_Packs" 
SET price = 4545.45 
WHERE name ILIKE '%ultimate%';

-- Actualizar precios de elementos adicionales
UPDATE "NEW_Budget_Additional_Items" 
SET price = 247.93 
WHERE name ILIKE '%microondas%';

UPDATE "NEW_Budget_Additional_Items" 
SET price = 1239.67 
WHERE name ILIKE '%aire%' OR name ILIKE '%acondicion%';

-- Actualizar precios de sistemas eléctricos
UPDATE "NEW_Budget_Electric" 
SET price = 818.18 
WHERE name ILIKE '%litio%' AND name NOT ILIKE '%+%' AND name NOT ILIKE '%plus%';

UPDATE "NEW_Budget_Electric" 
SET price = 1818.18, discount_price = 1000.00
WHERE name ILIKE '%litio%' AND (name ILIKE '%+%' OR name ILIKE '%plus%');

UPDATE "NEW_Budget_Electric" 
SET price = 2314.05, discount_price = 1495.87
WHERE name ILIKE '%pro%';