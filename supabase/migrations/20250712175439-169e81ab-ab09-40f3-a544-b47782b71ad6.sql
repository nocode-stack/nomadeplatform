-- Agregar columna estado_visual a la tabla NEW_Contracts
ALTER TABLE public."NEW_Contracts" 
ADD COLUMN estado_visual TEXT NOT NULL DEFAULT 'por_crear';

-- Actualizar los registros existentes basándose en el contract_status
UPDATE public."NEW_Contracts" 
SET estado_visual = CASE 
  WHEN contract_status = 'draft' THEN 'por_crear'
  WHEN contract_status = 'generated' THEN 'creado'
  WHEN contract_status = 'sent' THEN 'enviado'
  WHEN contract_status = 'signed' THEN 'enviado'
  ELSE 'por_crear'
END;