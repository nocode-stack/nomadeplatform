-- Sincronizar manualmente los datos de facturación existentes con los contratos
UPDATE public."NEW_Contracts" 
SET 
  billing_address = COALESCE(billing_data.billing_address, "NEW_Contracts".billing_address),
  billing_entity_name = CASE 
    WHEN billing_data.name IS NOT NULL AND billing_data.name != "NEW_Contracts".client_full_name 
    THEN billing_data.name 
    ELSE null 
  END,
  billing_entity_nif = billing_data.nif,
  updated_at = now()
FROM (
  SELECT 
    nb.client_id,
    nb.name,
    nb.nif,
    nb.billing_address
  FROM public."NEW_Billing" nb
) AS billing_data
WHERE "NEW_Contracts".client_id = billing_data.client_id 
AND "NEW_Contracts".is_latest = true;