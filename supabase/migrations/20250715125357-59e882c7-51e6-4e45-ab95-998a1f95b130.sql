-- Eliminar el trigger primero, luego la función, y recrear todo correctamente

-- Paso 1: Eliminar el trigger
DROP TRIGGER IF EXISTS trigger_contract_webhook ON public."NEW_Contracts";

-- Paso 2: Eliminar la función
DROP FUNCTION IF EXISTS public.call_trigger_contract_webhook();

-- Paso 3: Recrear la función con la sintaxis correcta para pg_net
CREATE OR REPLACE FUNCTION public.call_trigger_contract_webhook()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_id bigint;
BEGIN
  -- Realizar la llamada HTTP usando pg_net con la sintaxis correcta
  SELECT net.http_post(
    url := 'https://mqqibdpddkxjxonbende.supabase.co/functions/v1/trigger-contract-webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcWliZHBkZGt4anhvbmJlbmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMTk2OTEsImV4cCI6MjA2NjU5NTY5MX0.wMSRQ_wDrfA33mTzppsSR8DUwqGptKQ43gUqO4SI9MA'
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  ) INTO response_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla la llamada HTTP, no interrumpir el proceso principal
    RAISE NOTICE 'Error en webhook: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Paso 4: Recrear el trigger solo si es necesario (comentado por ahora para evitar problemas)
-- CREATE TRIGGER trigger_contract_webhook
--   AFTER INSERT OR UPDATE ON public."NEW_Contracts"
--   FOR EACH ROW
--   EXECUTE FUNCTION public.call_trigger_contract_webhook();