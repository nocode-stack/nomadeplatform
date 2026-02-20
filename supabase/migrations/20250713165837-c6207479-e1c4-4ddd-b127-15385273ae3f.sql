-- Primero modificar la estructura de NEW_Budget_Items para permitir items catálogo
ALTER TABLE public."NEW_Budget_Items" 
ALTER COLUMN budget_id DROP NOT NULL;

-- Ahora mover todos los conceptos de NEW_Budget_Concepts_Available a NEW_Budget_Items
INSERT INTO public."NEW_Budget_Items" (
  concept_id, pack_id, name, price, quantity, 
  line_total, is_custom, is_discount, order_index
)
SELECT 
  id as concept_id,
  pack_id,
  name,
  price,
  1 as quantity,
  price as line_total,
  false as is_custom,
  false as is_discount,
  ROW_NUMBER() OVER (ORDER BY name) as order_index
FROM public."NEW_Budget_Concepts_Available"
WHERE NOT EXISTS (
  SELECT 1 FROM public."NEW_Budget_Items" nbi 
  WHERE nbi.name = "NEW_Budget_Concepts_Available".name
);

-- Limpiar NEW_Budget_Packs - eliminar items individuales que no son packs
DELETE FROM public."NEW_Budget_Packs" 
WHERE name IN ('Microondas', 'Aire Acondicionado');

-- Añadir items base que faltaban
INSERT INTO public."NEW_Budget_Items" (
  name, price, quantity, line_total, is_custom, is_discount, order_index
) VALUES
('Cama interbanco', 800.00, 1, 800.00, false, false, 100),
('Ventana trasera', 400.00, 1, 400.00, false, false, 101),
('Techo elevable', 1200.00, 1, 1200.00, false, false, 102),
('Asientos giratorios delanteros', 600.00, 1, 600.00, false, false, 103),
('Mesa interior', 350.00, 1, 350.00, false, false, 104),
('Armarios superiores', 450.00, 1, 450.00, false, false, 107),
('Cajones bajo cama', 300.00, 1, 300.00, false, false, 108),
('Espacio de equipaje exterior', 200.00, 1, 200.00, false, false, 109),
('Batería auxiliar', 400.00, 1, 400.00, false, false, 110),
('Inversor 12V-220V', 300.00, 1, 300.00, false, false, 111),
('Cargador solar portátil', 500.00, 1, 500.00, false, false, 112),
('Luces LED interiores', 150.00, 1, 150.00, false, false, 113),
('Tomas USB y 12V', 100.00, 1, 100.00, false, false, 114),
('Depósito agua limpia 50L', 200.00, 1, 200.00, false, false, 115),
('Depósito aguas grises 40L', 180.00, 1, 180.00, false, false, 116),
('Bomba de agua', 120.00, 1, 120.00, false, false, 117),
('Calentador gas', 350.00, 1, 350.00, false, false, 118),
('Cocina gas 2 fuegos', 280.00, 1, 280.00, false, false, 119),
('Aislamiento térmico completo', 500.00, 1, 500.00, false, false, 120),
('Ventilación forzada', 200.00, 1, 200.00, false, false, 121),
('Cortinas opacas', 150.00, 1, 150.00, false, false, 122),
('Suelo vinílico', 300.00, 1, 300.00, false, false, 123)
ON CONFLICT (name) DO NOTHING;

-- Eliminar tablas innecesarias
DROP TABLE IF EXISTS public."NEW_Budget_Concepts_Available";
DROP TABLE IF EXISTS public."NEW_Budget_Structure";
DROP TABLE IF EXISTS public."NEW_Budget_Concepts";
DROP TABLE IF EXISTS public."NEW_Budget_Default_Components";