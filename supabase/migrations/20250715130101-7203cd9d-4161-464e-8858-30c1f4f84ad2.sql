-- Crear el trigger que conecta NEW_Contracts con el webhook
CREATE TRIGGER trigger_contract_webhook
  AFTER INSERT OR UPDATE ON public."NEW_Contracts"
  FOR EACH ROW
  EXECUTE FUNCTION public.call_trigger_contract_webhook();