-- Actualizar contratos existentes con datos actuales de clientes, vehículos y facturación
-- Esto es un proceso de una sola vez para sincronizar datos históricos

-- Actualizar contratos existentes con datos de clientes
UPDATE public."NEW_Contracts" 
SET 
  client_full_name = COALESCE(c.name, "NEW_Contracts".client_full_name),
  client_email = COALESCE(c.email, "NEW_Contracts".client_email),
  client_dni = COALESCE(c.dni, "NEW_Contracts".client_dni),
  client_phone = COALESCE(c.phone, "NEW_Contracts".client_phone),
  billing_address = COALESCE(c.address, "NEW_Contracts".billing_address),
  updated_at = now()
FROM public."NEW_Clients" c
WHERE "NEW_Contracts".client_id = c.id
AND "NEW_Contracts".is_latest = true;

-- Actualizar contratos existentes con datos de facturación
UPDATE public."NEW_Contracts" 
SET 
  billing_address = COALESCE(b.billing_address, "NEW_Contracts".billing_address),
  billing_entity_name = COALESCE(b.name, "NEW_Contracts".billing_entity_name),
  billing_entity_nif = COALESCE(b.nif, "NEW_Contracts".billing_entity_nif),
  updated_at = now()
FROM public."NEW_Billing" b
WHERE "NEW_Contracts".client_id = b.client_id
AND "NEW_Contracts".is_latest = true;

-- Actualizar contratos existentes con datos de vehículos
UPDATE public."NEW_Contracts" 
SET 
  vehicle_vin = COALESCE(v.numero_bastidor, "NEW_Contracts".vehicle_vin),
  vehicle_plate = COALESCE(v.matricula, "NEW_Contracts".vehicle_plate),
  vehicle_engine = COALESCE(v.engine, "NEW_Contracts".vehicle_engine),
  vehicle_model = COALESCE(
    CASE 
      WHEN v.engine IS NOT NULL OR v.transmission_type IS NOT NULL OR v.plazas IS NOT NULL 
      THEN CONCAT_WS(' ', v.engine, v.transmission_type, v.plazas, 'plazas')
      ELSE "NEW_Contracts".vehicle_model
    END,
    "NEW_Contracts".vehicle_model
  ),
  updated_at = now()
FROM public."NEW_Vehicles" v
WHERE "NEW_Contracts".project_id = v.project_id
AND "NEW_Contracts".is_latest = true
AND v.project_id IS NOT NULL;