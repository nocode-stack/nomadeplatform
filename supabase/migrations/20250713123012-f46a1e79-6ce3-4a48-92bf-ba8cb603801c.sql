-- Actualizar precios de motorización según las especificaciones
UPDATE public.engine_options 
SET price_modifier = 67500 
WHERE name = '140cv Manual';

UPDATE public.engine_options 
SET price_modifier = 71500 
WHERE name = '180cv Automática';

-- Actualizar precios de packs según las especificaciones
UPDATE public."NEW_Budget_Packs" 
SET price = 1500 
WHERE name = 'Essential';

UPDATE public."NEW_Budget_Packs" 
SET price = 4000 
WHERE name = 'Adventure';

UPDATE public."NEW_Budget_Packs" 
SET price = 5500 
WHERE name = 'Ultimate';

-- Actualizar precios de sistemas eléctricos
UPDATE public.electric_systems 
SET price = 990 
WHERE name = 'Litio';

UPDATE public.electric_systems 
SET price = 2200 
WHERE name = 'Litio+';

UPDATE public.electric_systems 
SET price = 2800 
WHERE name = 'Pro';