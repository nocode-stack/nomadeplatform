-- PASO 1: LIMPIEZA DE DATOS Y REFACTORING ARQUITECTURAL DE CONTRATOS

-- 1.1. Limpiar duplicados - mantener solo la versión más reciente de cada tipo por proyecto
WITH latest_contracts AS (
  SELECT 
    id,
    project_id,
    contract_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, contract_type 
      ORDER BY created_at DESC, version DESC
    ) as rn
  FROM "NEW_Contracts" 
  WHERE is_active = true
)
DELETE FROM "NEW_Contracts" 
WHERE id IN (
  SELECT id FROM latest_contracts WHERE rn > 1
);

-- 1.2. Establecer correctamente is_latest = true solo para el más reciente
UPDATE "NEW_Contracts" 
SET is_latest = false 
WHERE is_active = true;

-- 1.3. Marcar como latest solo la versión más reciente de cada tipo
WITH latest_contracts AS (
  SELECT 
    id,
    project_id,
    contract_type,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, contract_type 
      ORDER BY created_at DESC, version DESC
    ) as rn
  FROM "NEW_Contracts" 
  WHERE is_active = true
)
UPDATE "NEW_Contracts" 
SET is_latest = true
WHERE id IN (
  SELECT id FROM latest_contracts WHERE rn = 1
);

-- 1.4. Simplificar estados - unificar contract_status y estado_visual
-- Primero, migrar estados existentes a un esquema unificado
UPDATE "NEW_Contracts" 
SET estado_visual = CASE 
  WHEN estado_visual = 'por_crear' OR contract_status = 'draft' THEN 'draft'
  WHEN estado_visual = 'creado' OR contract_status = 'generated' THEN 'generated'
  WHEN estado_visual = 'en_edicion' THEN 'editing'
  WHEN estado_visual = 'enviado' OR contract_status = 'sent' THEN 'sent'
  WHEN estado_visual = 'firmado' OR contract_status = 'signed' THEN 'signed'
  WHEN estado_visual = 'cancelado' OR contract_status = 'cancelled' THEN 'cancelled'
  ELSE 'draft'
END;

-- 1.5. Sincronizar contract_status con estado_visual unificado
UPDATE "NEW_Contracts" 
SET contract_status = estado_visual;

-- 1.6. Crear constraint único para evitar múltiples is_latest = true por tipo
-- Primero crear un índice único parcial
DROP INDEX IF EXISTS idx_unique_latest_contract_per_type;
CREATE UNIQUE INDEX idx_unique_latest_contract_per_type 
ON "NEW_Contracts" (project_id, contract_type) 
WHERE is_latest = true AND is_active = true;

-- 1.7. Crear índices optimizados para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_contracts_project_type_active 
ON "NEW_Contracts" (project_id, contract_type, is_active);

CREATE INDEX IF NOT EXISTS idx_contracts_status_latest 
ON "NEW_Contracts" (estado_visual, is_latest) 
WHERE is_active = true;

-- 1.8. Función para mantener consistencia automáticamente
CREATE OR REPLACE FUNCTION ensure_single_latest_contract()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando como latest = true, desmarcar todos los otros del mismo tipo
  IF NEW.is_latest = true AND NEW.is_active = true THEN
    UPDATE "NEW_Contracts" 
    SET is_latest = false 
    WHERE project_id = NEW.project_id 
      AND contract_type = NEW.contract_type 
      AND id != NEW.id
      AND is_active = true;
  END IF;
  
  -- Sincronizar contract_status con estado_visual
  NEW.contract_status = NEW.estado_visual;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.9. Crear trigger para mantener consistencia
DROP TRIGGER IF EXISTS trigger_ensure_single_latest ON "NEW_Contracts";
CREATE TRIGGER trigger_ensure_single_latest
  BEFORE INSERT OR UPDATE ON "NEW_Contracts"
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_latest_contract();

-- 1.10. Función optimizada para generar nueva versión de contrato
CREATE OR REPLACE FUNCTION generate_contract_version(
  p_project_id UUID,
  p_contract_type TEXT,
  p_contract_data JSONB
) RETURNS UUID AS $$
DECLARE
  new_contract_id UUID;
  current_version INTEGER;
BEGIN
  -- Obtener la versión actual
  SELECT COALESCE(MAX(version), 0) INTO current_version
  FROM "NEW_Contracts"
  WHERE project_id = p_project_id 
    AND contract_type = p_contract_type
    AND is_active = true;

  -- Marcar contratos anteriores como no latest
  UPDATE "NEW_Contracts" 
  SET is_latest = false
  WHERE project_id = p_project_id 
    AND contract_type = p_contract_type
    AND is_active = true;

  -- Insertar nueva versión
  INSERT INTO "NEW_Contracts" (
    project_id,
    contract_type,
    client_id,
    client_full_name,
    client_dni,
    client_email,
    client_phone,
    billing_entity_name,
    billing_entity_nif,
    billing_address,
    vehicle_model,
    vehicle_vin,
    vehicle_plate,
    vehicle_engine,
    total_price,
    payment_reserve,
    payment_conditions,
    iban,
    delivery_months,
    payment_first_percentage,
    payment_first_amount,
    payment_second_percentage,
    payment_second_amount,
    payment_third_percentage,
    payment_third_amount,
    version,
    is_active,
    is_latest,
    estado_visual,
    contract_status
  ) VALUES (
    p_project_id,
    p_contract_type,
    (p_contract_data->>'client_id')::UUID,
    p_contract_data->>'client_full_name',
    p_contract_data->>'client_dni',
    p_contract_data->>'client_email',
    p_contract_data->>'client_phone',
    p_contract_data->>'billing_entity_name',
    p_contract_data->>'billing_entity_nif',
    p_contract_data->>'billing_address',
    p_contract_data->>'vehicle_model',
    p_contract_data->>'vehicle_vin',
    p_contract_data->>'vehicle_plate',
    p_contract_data->>'vehicle_engine',
    COALESCE((p_contract_data->>'total_price')::NUMERIC, 0),
    COALESCE((p_contract_data->>'payment_reserve')::NUMERIC, 0),
    p_contract_data->>'payment_conditions',
    COALESCE(p_contract_data->>'iban', 'ES80 0081 7011 1900 0384 8192'),
    COALESCE((p_contract_data->>'delivery_months')::INTEGER, 0),
    COALESCE((p_contract_data->>'payment_first_percentage')::NUMERIC, 0),
    COALESCE((p_contract_data->>'payment_first_amount')::NUMERIC, 0),
    COALESCE((p_contract_data->>'payment_second_percentage')::NUMERIC, 0),
    COALESCE((p_contract_data->>'payment_second_amount')::NUMERIC, 0),
    COALESCE((p_contract_data->>'payment_third_percentage')::NUMERIC, 0),
    COALESCE((p_contract_data->>'payment_third_amount')::NUMERIC, 0),
    current_version + 1,
    true,
    true,
    'generated',
    'generated'
  ) RETURNING id INTO new_contract_id;

  RETURN new_contract_id;
END;
$$ LANGUAGE plpgsql;