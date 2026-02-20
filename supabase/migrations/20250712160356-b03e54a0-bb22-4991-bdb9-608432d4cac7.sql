-- Función para crear contratos automáticamente cuando se crea un proyecto
CREATE OR REPLACE FUNCTION public.create_project_contracts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear los 3 contratos básicos para el nuevo proyecto
  INSERT INTO public."NEW_Contracts" (
    project_id,
    client_id,
    contract_type,
    contract_status,
    client_full_name,
    client_dni,
    client_email,
    client_phone,
    billing_address,
    vehicle_model,
    total_price,
    iban
  ) VALUES 
  -- Contrato de Reserva
  (
    NEW.id,
    NEW.client_id,
    'reservation',
    'draft',
    COALESCE((SELECT name FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT dni FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT email FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT phone FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT address FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    '',
    0,
    'ES80 0081 7011 1900 0384 8192'
  ),
  -- Acuerdo de Compraventa
  (
    NEW.id,
    NEW.client_id,
    'purchase_agreement',
    'draft',
    COALESCE((SELECT name FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT dni FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT email FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT phone FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT address FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    '',
    0,
    'ES80 0081 7011 1900 0384 8192'
  ),
  -- Contrato de Compraventa
  (
    NEW.id,
    NEW.client_id,
    'sale_contract',
    'draft',
    COALESCE((SELECT name FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT dni FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT email FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT phone FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    COALESCE((SELECT address FROM "NEW_Clients" WHERE id = NEW.client_id), ''),
    '',
    0,
    'ES80 0081 7011 1900 0384 8192'
  );

  RETURN NEW;
END;
$$;

-- Crear trigger para ejecutar la función después de insertar un proyecto
CREATE TRIGGER trigger_create_project_contracts
  AFTER INSERT ON public."NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION public.create_project_contracts();