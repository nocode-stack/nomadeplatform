-- Agregar columnas para versionado de contratos
ALTER TABLE public."NEW_Contracts" 
ADD COLUMN version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN parent_contract_id UUID REFERENCES public."NEW_Contracts"(id) ON DELETE SET NULL;

-- Crear índices para mejor rendimiento
CREATE INDEX idx_new_contracts_version ON public."NEW_Contracts"(project_id, contract_type, is_active);
CREATE INDEX idx_new_contracts_parent ON public."NEW_Contracts"(parent_contract_id);

-- Actualizar contratos existentes para ser versión 1 y activos
UPDATE public."NEW_Contracts" 
SET version = 1, is_active = true 
WHERE version IS NULL OR is_active IS NULL;