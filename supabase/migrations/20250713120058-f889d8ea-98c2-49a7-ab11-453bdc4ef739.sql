-- FASE 1: MIGRACIÓN DE DATOS MAESTROS
-- Migrar conceptos de budget_concepts a NEW_Budget_Concepts
INSERT INTO public."NEW_Budget_Concepts" (
  name, 
  category, 
  subcategory, 
  price, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  name,
  category,
  subcategory,
  price,
  is_active,
  created_at,
  updated_at
FROM public.budget_concepts
WHERE NOT EXISTS (
  SELECT 1 FROM public."NEW_Budget_Concepts" nbc 
  WHERE nbc.name = budget_concepts.name AND nbc.category = budget_concepts.category
);

-- Migrar packs de budget_packs a NEW_Budget_Packs
INSERT INTO public."NEW_Budget_Packs" (
  name,
  description,
  price,
  is_active,
  created_at,
  updated_at
)
SELECT 
  name,
  description,
  price,
  is_active,
  created_at,
  updated_at
FROM public.budget_packs
WHERE NOT EXISTS (
  SELECT 1 FROM public."NEW_Budget_Packs" nbp 
  WHERE nbp.name = budget_packs.name
);

-- Crear descuentos básicos en NEW_Budget_Discounts
INSERT INTO public."NEW_Budget_Discounts" (code, label, description, is_active) VALUES
('EARLY_BIRD', 'Descuento Cliente Temprano', 'Descuento por reserva anticipada', true),
('VOLUME', 'Descuento por Volumen', 'Descuento aplicado a pedidos grandes', true),
('LOYALTY', 'Descuento Fidelidad', 'Descuento por cliente recurrente', true),
('SEASONAL', 'Descuento Estacional', 'Descuento por temporada específica', true),
('COMMERCIAL', 'Descuento Comercial', 'Descuento comercial general', true),
('SPECIAL', 'Descuento Especial', 'Descuento para casos especiales', true)
ON CONFLICT DO NOTHING;

-- Crear índices adicionales para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_new_budget_concepts_category_active ON public."NEW_Budget_Concepts"(category, is_active);
CREATE INDEX IF NOT EXISTS idx_new_budget_packs_active ON public."NEW_Budget_Packs"(is_active);
CREATE INDEX IF NOT EXISTS idx_new_budget_discounts_active ON public."NEW_Budget_Discounts"(is_active);

-- Log de migración
INSERT INTO public."NEW_Budget_Default_Components" (name, category, description, included_in_base) VALUES
('Migración de Datos Completada', 'system', 'Registro de migración de datos de tablas antigas a nuevas', false)
ON CONFLICT DO NOTHING;