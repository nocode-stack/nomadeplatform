-- 1. Eliminar foreign key constraint problemática de NEW_Budget_Items hacia NEW_Budget_Structure
ALTER TABLE public."NEW_Budget_Items" 
DROP CONSTRAINT IF EXISTS "NEW_Budget_Items_budget_id_fkey";

-- 2. Modificar budget_id para permitir NULL (items catálogo)
ALTER TABLE public."NEW_Budget_Items" 
ALTER COLUMN budget_id DROP NOT NULL;

-- 3. Limpiar NEW_Budget_Items existente 
DELETE FROM public."NEW_Budget_Items";

-- 4. Mover TODOS los conceptos de Available a Items
INSERT INTO public."NEW_Budget_Items" (
  pack_id, name, price, quantity, line_total, is_custom, is_discount, order_index
)
SELECT 
  pack_id,
  name,
  price,
  1 as quantity,
  price as line_total,
  false as is_custom,
  false as is_discount,
  ROW_NUMBER() OVER (ORDER BY name) as order_index
FROM public."NEW_Budget_Concepts_Available";

-- 5. Eliminar tablas innecesarias
DROP TABLE IF EXISTS public."NEW_Budget_Concepts_Available" CASCADE;
DROP TABLE IF EXISTS public."NEW_Budget_Structure" CASCADE;  
DROP TABLE IF EXISTS public."NEW_Budget_Concepts" CASCADE;
DROP TABLE IF EXISTS public."NEW_Budget_Default_Components" CASCADE;

-- 6. Limpiar packs que no son realmente packs
DELETE FROM public."NEW_Budget_Packs" 
WHERE name IN ('Microondas', 'Aire Acondicionado');

-- 7. Añadir items base adicionales (sin ON CONFLICT)
INSERT INTO public."NEW_Budget_Items" (
  name, price, quantity, line_total, is_custom, is_discount, order_index
) VALUES
('Cama interbanco', 800.00, 1, 800.00, false, false, 200),
('Ventana trasera', 400.00, 1, 400.00, false, false, 201),
('Techo elevable', 1200.00, 1, 1200.00, false, false, 202),
('Asientos giratorios delanteros', 600.00, 1, 600.00, false, false, 203),
('Mesa interior', 350.00, 1, 350.00, false, false, 204),
('Armarios superiores', 450.00, 1, 450.00, false, false, 205),
('Cajones bajo cama', 300.00, 1, 300.00, false, false, 206),
('Espacio de equipaje exterior', 200.00, 1, 200.00, false, false, 207),
('Batería auxiliar', 400.00, 1, 400.00, false, false, 208),
('Inversor 12V-220V', 300.00, 1, 300.00, false, false, 209),
('Cargador solar portátil', 500.00, 1, 500.00, false, false, 210),
('Luces LED interiores', 150.00, 1, 150.00, false, false, 211),
('Tomas USB y 12V', 100.00, 1, 100.00, false, false, 212),
('Depósito agua limpia 50L', 200.00, 1, 200.00, false, false, 213),
('Depósito aguas grises 40L', 180.00, 1, 180.00, false, false, 214),
('Bomba de agua', 120.00, 1, 120.00, false, false, 215),
('Calentador gas', 350.00, 1, 350.00, false, false, 216),
('Cocina gas 2 fuegos', 280.00, 1, 280.00, false, false, 217),
('Aislamiento térmico completo', 500.00, 1, 500.00, false, false, 218),
('Ventilación forzada', 200.00, 1, 200.00, false, false, 219),
('Cortinas opacas', 150.00, 1, 150.00, false, false, 220),
('Suelo vinílico', 300.00, 1, 300.00, false, false, 221);

-- 8. Crear nueva foreign key hacia NEW_Budget cuando se añaden items a presupuesto específico
ALTER TABLE public."NEW_Budget_Items" 
ADD CONSTRAINT "NEW_Budget_Items_budget_id_fkey" 
FOREIGN KEY (budget_id) REFERENCES public."NEW_Budget"(id) ON DELETE CASCADE;