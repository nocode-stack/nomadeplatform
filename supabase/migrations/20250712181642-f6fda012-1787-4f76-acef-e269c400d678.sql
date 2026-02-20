-- Limpiar contratos duplicados con is_latest = true
-- Paso 1: Marcar todos como is_latest = false
UPDATE "NEW_Contracts" 
SET is_latest = false 
WHERE project_id = '82618229-82c3-47ec-a69c-e15f6b306756';

-- Paso 2: Marcar solo el más reciente de cada tipo como is_latest = true
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