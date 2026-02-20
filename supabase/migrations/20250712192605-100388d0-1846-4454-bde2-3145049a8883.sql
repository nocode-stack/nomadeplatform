-- Corregir los contratos existentes para mapear correctamente los campos de facturación
UPDATE public."NEW_Contracts" 
SET 
  -- Solo llenar billing_entity_name si la entidad de facturación es diferente al cliente
  billing_entity_name = CASE 
    WHEN b.name IS NOT NULL AND b.name != "NEW_Contracts".client_full_name 
    THEN b.name 
    ELSE null 
  END,
  -- billing_entity_nif siempre viene de NEW_Billing.nif
  billing_entity_nif = b.nif,
  billing_address = COALESCE(b.billing_address, "NEW_Contracts".billing_address),
  updated_at = now()
FROM public."NEW_Billing" b
WHERE "NEW_Contracts".client_id = b.client_id
AND "NEW_Contracts".is_latest = true;