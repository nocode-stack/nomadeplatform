
-- Eliminar el trigger problemático que está causando el error
DROP TRIGGER IF EXISTS calculate_pending_amount_trigger ON public.projects;

-- Eliminar también la función asociada ya que no la necesitamos
DROP FUNCTION IF EXISTS public.calculate_pending_amount();
