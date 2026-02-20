-- Reorganizar estructura de presupuestos

-- 1. Primero mover todos los conceptos de NEW_Budget_Concepts_Available a NEW_Budget_Items
INSERT INTO public."NEW_Budget_Items" (
  budget_id, concept_id, pack_id, name, price, quantity, 
  line_total, is_custom, is_discount, order_index
)
SELECT 
  NULL as budget_id, -- No están asignados a presupuesto específico aún
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

-- 2. Limpiar NEW_Budget_Packs - eliminar items individuales que no son packs
DELETE FROM public."NEW_Budget_Packs" 
WHERE name IN ('Microondas', 'Aire Acondicionado');

-- 3. Añadir items base que faltaban en NEW_Budget_Items
INSERT INTO public."NEW_Budget_Items" (
  name, price, quantity, line_total, is_custom, is_discount, order_index
) VALUES
-- Items base del vehículo
('Cama interbanco', 800.00, 1, 800.00, false, false, 100),
('Ventana trasera', 400.00, 1, 400.00, false, false, 101),
('Techo elevable', 1200.00, 1, 1200.00, false, false, 102),
('Asientos giratorios delanteros', 600.00, 1, 600.00, false, false, 103),
('Mesa interior', 350.00, 1, 350.00, false, false, 104),
('Microondas', 250.00, 1, 250.00, false, false, 105),
('Aire Acondicionado', 800.00, 1, 800.00, false, false, 106),
-- Items de almacenamiento
('Armarios superiores', 450.00, 1, 450.00, false, false, 107),
('Cajones bajo cama', 300.00, 1, 300.00, false, false, 108),
('Espacio de equipaje exterior', 200.00, 1, 200.00, false, false, 109),
-- Items eléctricos y sistemas
('Batería auxiliar', 400.00, 1, 400.00, false, false, 110),
('Inversor 12V-220V', 300.00, 1, 300.00, false, false, 111),
('Cargador solar portátil', 500.00, 1, 500.00, false, false, 112),
('Luces LED interiores', 150.00, 1, 150.00, false, false, 113),
('Tomas USB y 12V', 100.00, 1, 100.00, false, false, 114),
-- Items de agua y gas
('Depósito agua limpia 50L', 200.00, 1, 200.00, false, false, 115),
('Depósito aguas grises 40L', 180.00, 1, 180.00, false, false, 116),
('Bomba de agua', 120.00, 1, 120.00, false, false, 117),
('Calentador gas', 350.00, 1, 350.00, false, false, 118),
('Cocina gas 2 fuegos', 280.00, 1, 280.00, false, false, 119),
-- Items de confort
('Aislamiento térmico completo', 500.00, 1, 500.00, false, false, 120),
('Ventilación forzada', 200.00, 1, 200.00, false, false, 121),
('Cortinas opacas', 150.00, 1, 150.00, false, false, 122),
('Suelo vinílico', 300.00, 1, 300.00, false, false, 123)
ON CONFLICT (name) DO NOTHING;

-- 4. Eliminar tablas innecesarias
DROP TABLE IF EXISTS public."NEW_Budget_Concepts_Available";
DROP TABLE IF EXISTS public."NEW_Budget_Structure";
DROP TABLE IF EXISTS public."NEW_Budget_Concepts";
DROP TABLE IF EXISTS public."NEW_Budget_Default_Components";

-- 5. Asegurar que NEW_Budget_Packs solo tiene packs reales
UPDATE public."NEW_Budget_Packs" 
SET description = CASE 
  WHEN name = 'Pack Adventure' THEN 'Configuración completa para aventuras con todo lo necesario para viajes largos'
  WHEN name = 'Pack Business' THEN 'Diseño profesional con espacio de trabajo móvil'
  WHEN name = 'Pack Family' THEN 'Perfecto para familias con espacio optimizado'
  WHEN name = 'Pack Off-Road' THEN 'Equipamiento reforzado para terrenos difíciles'
  WHEN name = 'Pack Básico' THEN 'Configuración esencial para comenzar'
  WHEN name = 'Neo Essential' THEN 'Pack básico Neo con elementos esenciales'
  WHEN name = 'Neo Adventure' THEN 'Pack Neo completo para aventuras'
  WHEN name = 'Neo Ultimate' THEN 'Pack Neo premium con todo incluido'
  WHEN name = 'Sistema Litio' THEN 'Sistema eléctrico básico con batería litio'
  WHEN name = 'Sistema Litio+' THEN 'Sistema eléctrico avanzado con batería litio'
  WHEN name = 'Sistema Pro' THEN 'Sistema eléctrico profesional completo'
  ELSE description
END;