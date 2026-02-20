-- Eliminar tablas antiguas del sistema de presupuestos

-- Eliminar tablas en el orden correcto para evitar errores de FK
DROP TABLE IF EXISTS public.budget_pdfs CASCADE;
DROP TABLE IF EXISTS public.budget_items CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.budget_concepts CASCADE;
DROP TABLE IF EXISTS public.budget_packs CASCADE;
DROP TABLE IF EXISTS public.extra_components CASCADE;
DROP TABLE IF EXISTS public.electric_systems CASCADE;