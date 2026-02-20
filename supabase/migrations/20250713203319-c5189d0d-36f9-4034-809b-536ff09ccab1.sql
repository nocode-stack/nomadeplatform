-- Fix para eliminar el trigger problemático que busca is_primary que no existe
-- Este trigger se creó anteriormente pero el campo is_primary no existe tras el revert

-- Eliminar la función con CASCADE para que elimine también el trigger
DROP FUNCTION IF EXISTS public.ensure_single_primary_contract() CASCADE;