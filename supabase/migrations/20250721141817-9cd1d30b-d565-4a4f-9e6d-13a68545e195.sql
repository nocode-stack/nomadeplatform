-- Añadir nueva opción de motorización "Sin vehículo" para proyectos de camperización
-- Precio: 36.000€ con IVA = 29.752,07€ sin IVA

INSERT INTO public.model_options (
  name,
  price_modifier,
  is_active,
  order_index
) VALUES (
  'Sin vehículo',
  29752.07,  -- 36.000€ con IVA / 1.21 = 29.752,07€ sin IVA
  true,
  999  -- Ponerlo al final de la lista
);

-- Verificar que se insertó correctamente
SELECT name, price_modifier, is_active, order_index 
FROM public.model_options 
WHERE name = 'Sin vehículo';