-- Crear trigger para actualizar datos del contrato cuando se modifica
CREATE TRIGGER trigger_ensure_single_latest_update
  BEFORE UPDATE ON public."NEW_Contracts"
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_latest_contract();