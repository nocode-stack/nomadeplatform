-- Actualizar la función para incluir también el código del proyecto
CREATE OR REPLACE FUNCTION public.notify_incident_status_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  client_name TEXT;
  status_label TEXT;
  project_code TEXT;
  request_id BIGINT;
BEGIN
  -- Solo ejecutar cuando el estado cambia a "fechas_asignadas"
  IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
    -- Verificar si el nuevo estado es "fechas_asignadas"
    SELECT label INTO status_label
    FROM public."NEW_Incident_Status"
    WHERE id = NEW.status_id AND status_code = 'fechas_asignadas';
    
    -- Si es el estado "fechas_asignadas", proceder con la notificación
    IF status_label IS NOT NULL THEN
      -- Obtener el nombre del cliente y código del proyecto
      SELECT c.name, p.project_code INTO client_name, project_code
      FROM public."NEW_Projects" p
      JOIN public."NEW_Clients" c ON p.client_id = c.id
      WHERE p.id = NEW.project_id;
      
      -- Construir el payload con toda la información solicitada
      payload := json_build_object(
        'codigo_incidencia', NEW.reference_number,
        'codigo_proyecto', project_code,
        'nombre_cliente', COALESCE(client_name, 'Cliente no encontrado'),
        'fecha_entrada', NEW.repair_entry_date,
        'fecha_salida', NEW.repair_exit_date,
        'status_incidencia', status_label,
        'link_incidencia', concat('https://mqqibdpddkxjxonbende.lovable.app/proyectos/', NEW.project_id, '?tab=incidencias&incident=', NEW.id)
      );
      
      -- Realizar la llamada HTTP al webhook de n8n con la sintaxis correcta
      SELECT net.http_post(
        url := 'https://ignasiribo.app.n8n.cloud/webhook/fechas_incidencia',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := payload::jsonb
      ) INTO request_id;
      
      RAISE NOTICE 'Notificación enviada a n8n para incidencia: % - Proyecto: % - Estado: % - Request ID: %', NEW.reference_number, project_code, status_label, request_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;