-- Actualizar contratos existentes con datos actuales de clientes, vehículos y facturación
-- Esto es un proceso de una sola vez para sincronizar datos históricos

-- Actualizar contratos existentes con datos de clientes
UPDATE public."NEW_Contracts" 
SET 
  client_full_name = COALESCE(c.name, client_full_name),
  client_email = COALESCE(c.email, client_email),
  client_dni = COALESCE(c.dni, client_dni),
  client_phone = COALESCE(c.phone, client_phone),
  billing_address = COALESCE(c.address, billing_address),
  updated_at = now()
FROM public."NEW_Clients" c
WHERE public."NEW_Contracts".client_id = c.id
AND public."NEW_Contracts".is_latest = true;

-- Actualizar contratos existentes con datos de facturación
UPDATE public."NEW_Contracts" 
SET 
  billing_address = COALESCE(b.billing_address, billing_address),
  billing_entity_name = COALESCE(b.name, billing_entity_name),
  billing_entity_nif = COALESCE(b.nif, billing_entity_nif),
  updated_at = now()
FROM public."NEW_Billing" b
WHERE public."NEW_Contracts".client_id = b.client_id
AND public."NEW_Contracts".is_latest = true;

-- Actualizar contratos existentes con datos de vehículos
UPDATE public."NEW_Contracts" 
SET 
  vehicle_vin = COALESCE(v.numero_bastidor, vehicle_vin),
  vehicle_plate = COALESCE(v.matricula, vehicle_plate),
  vehicle_engine = COALESCE(v.engine, vehicle_engine),
  vehicle_model = COALESCE(
    CASE 
      WHEN v.engine IS NOT NULL OR v.transmission_type IS NOT NULL OR v.plazas IS NOT NULL 
      THEN CONCAT_WS(' ', v.engine, v.transmission_type, v.plazas, 'plazas')
      ELSE vehicle_model
    END,
    vehicle_model
  ),
  updated_at = now()
FROM public."NEW_Vehicles" v
WHERE public."NEW_Contracts".project_id = v.project_id
AND public."NEW_Contracts".is_latest = true
AND v.project_id IS NOT NULL;