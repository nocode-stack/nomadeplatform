-- Modificar la función del trigger para que solo se dispare cuando estado_visual cambia a 'sent'
CREATE OR REPLACE FUNCTION public.call_trigger_contract_webhook()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_id bigint;
BEGIN
  -- Solo ejecutar el webhook cuando se cambia el estado_visual a 'sent'
  -- Para INSERT: cuando se inserta directamente con estado 'sent'
  -- Para UPDATE: cuando cambia de cualquier estado a 'sent'
  IF (TG_OP = 'INSERT' AND NEW.estado_visual = 'sent') OR 
     (TG_OP = 'UPDATE' AND OLD.estado_visual IS DISTINCT FROM NEW.estado_visual AND NEW.estado_visual = 'sent') THEN
    
    -- Realizar la llamada HTTP usando pg_net
    SELECT net.http_post(
      url := 'https://mqqibdpddkxjxonbende.supabase.co/functions/v1/trigger-contract-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcWliZHBkZGt4anhvbmJlbmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMTk2OTEsImV4cCI6MjA2NjU5NTY5MX0.wMSRQ_wDrfA33mTzppsSR8DUwqGptKQ43gUqO4SI9MA'
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    ) INTO response_id;
    
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla la llamada HTTP, no interrumpir el proceso principal
    RAISE NOTICE 'Error en webhook: %', SQLERRM;
    RETURN NEW;
END;
$$;