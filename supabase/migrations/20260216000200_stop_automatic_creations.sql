-- Migración para desactivar creaciones automáticas y restringir webhooks
-- Objetivo: Permitir que el frontend controle el flujo (Solo Cliente vs Proyecto vs Todo)

-- 1. Eliminar disparador que crea proyectos automáticamente al crear un cliente prospecto
DROP TRIGGER IF EXISTS ensure_prospect_project_trigger ON public."NEW_Clients";
DROP FUNCTION IF EXISTS public.ensure_prospect_has_project();

-- 2. Eliminar disparador que crea 3 contratos automáticamente al crear un proyecto
DROP TRIGGER IF EXISTS trigger_create_project_contracts ON public."NEW_Projects";
DROP FUNCTION IF EXISTS public.create_project_contracts();

-- 3. Restringir el webhook de n8n para que solo se dispare en estados específicos
-- Modificamos la función del webhook para que solo actúe si el contrato se marca como 'ready_to_send' o 'sent'
CREATE OR REPLACE FUNCTION public.call_trigger_contract_webhook()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_id bigint;
BEGIN
  -- SOLO disparar el webhook si el estado indica una intención deliberada de enviar/generar el documento
  -- O si es un nuevo contrato que ya viene con un estado avanzado
  IF (NEW.contract_status IN ('ready_to_send', 'sent', 'signed')) THEN
    
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
    -- No interrumpir el proceso principal si falla el webhook
    RAISE NOTICE 'Error en webhook: %', SQLERRM;
    RETURN NEW;
END;
$$;
