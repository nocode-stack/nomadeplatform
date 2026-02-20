-- Restaurar datos de facturación en el contrato de reserva
UPDATE "NEW_Contracts" 
SET 
  billing_entity_name = CASE 
    WHEN b.name IS NOT NULL AND b.name != c.name 
    THEN b.name 
    ELSE NULL 
  END,
  billing_entity_nif = b.nif,
  billing_address = COALESCE(b.billing_address, c.address, 'Dirección pendiente'),
  updated_at = now()
FROM "NEW_Projects" p
JOIN "NEW_Clients" c ON p.client_id = c.id
LEFT JOIN "NEW_Billing" b ON c.id = b.client_id
WHERE "NEW_Contracts".project_id = p.id 
  AND "NEW_Contracts".contract_type = 'reservation'
  AND "NEW_Contracts".is_latest = true
  AND "NEW_Contracts".project_id = '82618229-82c3-47ec-a69c-e15f6b306756';