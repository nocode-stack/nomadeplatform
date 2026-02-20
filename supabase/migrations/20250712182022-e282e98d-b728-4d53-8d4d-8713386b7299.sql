-- Eliminar todos los contratos duplicados, dejando solo el más reciente de cada tipo
WITH latest_contracts AS (
  SELECT 
    id,
    contract_type,
    ROW_NUMBER() OVER (PARTITION BY project_id, contract_type ORDER BY created_at DESC) as rn
  FROM "NEW_Contracts" 
  WHERE project_id = '82618229-82c3-47ec-a69c-e15f6b306756'
    AND is_active = true
)
DELETE FROM "NEW_Contracts" 
WHERE id IN (
  SELECT id FROM latest_contracts WHERE rn > 1
);

-- Asegurar que solo los más recientes tengan is_latest = true
UPDATE "NEW_Contracts" 
SET is_latest = false 
WHERE project_id = '82618229-82c3-47ec-a69c-e15f6b306756';

WITH latest_contracts AS (
  SELECT 
    contract_type,
    MAX(created_at) as max_created_at
  FROM "NEW_Contracts" 
  WHERE project_id = '82618229-82c3-47ec-a69c-e15f6b306756'
    AND is_active = true
  GROUP BY contract_type
)
UPDATE "NEW_Contracts" 
SET is_latest = true
FROM latest_contracts
WHERE "NEW_Contracts".project_id = '82618229-82c3-47ec-a69c-e15f6b306756'
  AND "NEW_Contracts".contract_type = latest_contracts.contract_type
  AND "NEW_Contracts".created_at = latest_contracts.max_created_at
  AND "NEW_Contracts".is_active = true;