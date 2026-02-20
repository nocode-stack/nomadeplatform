-- Fix para eliminar el trigger problemático que busca is_primary que no existe
-- Este trigger se creó anteriormente pero el campo is_primary no existe tras el revert

-- Eliminar el trigger que causa el error
DROP TRIGGER IF EXISTS ensure_single_primary_contract_trigger ON public."NEW_Contracts";

-- Eliminar la función que también busca is_primary
DROP FUNCTION IF EXISTS public.ensure_single_primary_contract();