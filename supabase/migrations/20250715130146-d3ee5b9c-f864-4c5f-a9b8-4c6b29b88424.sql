-- Primero eliminar el trigger si existe y recrearlo
DROP TRIGGER IF EXISTS trigger_contract_webhook ON public."NEW_Contracts";

-- Recrear el trigger
CREATE TRIGGER trigger_contract_webhook
  AFTER INSERT OR UPDATE ON public."NEW_Contracts"
  FOR EACH ROW
  EXECUTE FUNCTION public.call_trigger_contract_webhook();