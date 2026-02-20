-- Corregir: Mover "Sin vehículo" de model_options a engine_options
-- Primero eliminar de model_options
DELETE FROM public.model_options WHERE name = 'Sin vehículo';

-- Añadir en engine_options como nueva categoría de motorización
INSERT INTO public.engine_options (
  name,
  power,
  transmission,
  price_modifier,
  is_active,
  order_index
) VALUES (
  'Sin vehículo',
  'N/A',  -- No aplica potencia
  'N/A',  -- No aplica transmisión
  29752.07,  -- 36.000€ con IVA / 1.21 = 29.752,07€ sin IVA
  true,
  999  -- Al final de la lista
);

-- Verificar que se movió correctamente
SELECT name, power, transmission, price_modifier, is_active 
FROM public.engine_options 
WHERE name = 'Sin vehículo';