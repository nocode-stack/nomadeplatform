-- FASE 1: Eliminar tablas que ya no se usan

-- Eliminar tabla project_codes (reemplazada por NEW_Production_Schedule)
DROP TABLE IF EXISTS public.project_codes CASCADE;

-- Eliminar tabla vehicle_options (reemplazada por especificaciones directas en NEW_Vehicles)
DROP TABLE IF EXISTS public.vehicle_options CASCADE;

-- Eliminar tabla project_comments (reemplazada por NEW_Comments)
DROP TABLE IF EXISTS public.project_comments CASCADE;