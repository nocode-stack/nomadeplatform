-- Cambiar nombre de "Sin vehículo" a "Solo camperización"
UPDATE public.engine_options 
SET name = 'Solo camperización'
WHERE name = 'Sin vehículo';

-- Verificar el cambio
SELECT name, power, transmission, price_modifier, is_active 
FROM public.engine_options 
WHERE name = 'Solo camperización';