-- 1. ACTUALIZAR CONTRATOS EXISTENTES CON DNI FALTANTE
UPDATE "NEW_Contracts" 
SET client_dni = 'PENDIENTE'
WHERE client_dni IS NULL;

-- 2. MODIFICAR LA COLUMNA PARA PERMITIR VALORES NULL TEMPORALMENTE
ALTER TABLE "NEW_Contracts" 
ALTER COLUMN client_dni DROP NOT NULL;

-- 3. CORREGIR EL TRIGGER DE SINCRONIZACIÓN DE CLIENTES PARA MANEJAR DNI NULL
CREATE OR REPLACE FUNCTION sync_client_data_to_contracts()
RETURNS TRIGGER AS $$
DECLARE
  billing_data RECORD;
BEGIN
  -- Obtener datos de facturación del cliente si existen
  SELECT * INTO billing_data 
  FROM public."NEW_Billing" 
  WHERE client_id = NEW.id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Actualizar todos los contratos activos de este cliente
  UPDATE public."NEW_Contracts" 
  SET 
    client_full_name = NEW.name,
    client_email = NEW.email,
    client_dni = COALESCE(NEW.dni, 'PENDIENTE'), -- Usar 'PENDIENTE' si DNI es NULL
    client_phone = NEW.phone,
    billing_address = COALESCE(billing_data.billing_address, NEW.address, billing_address),
    billing_entity_name = CASE 
      WHEN billing_data.name IS NOT NULL AND billing_data.name != NEW.name 
      THEN billing_data.name 
      ELSE null 
    END,
    billing_entity_nif = billing_data.nif,
    updated_at = now()
  WHERE client_id = NEW.id AND is_latest = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CORREGIR EL TRIGGER DE CREACIÓN DE CONTRATOS PARA MANEJAR DNI NULL
CREATE OR REPLACE FUNCTION create_project_contracts()
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
    COALESCE((SELECT dni FROM "NEW_Clients" WHERE id = NEW.client_id), 'PENDIENTE'),
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
    COALESCE((SELECT dni FROM "NEW_Clients" WHERE id = NEW.client_id), 'PENDIENTE'),
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
    COALESCE((SELECT dni FROM "NEW_Clients" WHERE id = NEW.client_id), 'PENDIENTE'),
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