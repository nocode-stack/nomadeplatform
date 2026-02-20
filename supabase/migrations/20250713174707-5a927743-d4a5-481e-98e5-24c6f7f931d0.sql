-- Limpiar tabla NEW_Budget eliminando campos innecesarios

-- Eliminar campos redundantes y no utilizados
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS incident_id;
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS budget_number;
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS budget_type;
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS description;
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS discount_percentage;

-- Eliminar campos de cliente (redundantes con project_id)
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS client_name;
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS client_email;
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS client_phone;
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS client_address;

-- Eliminar campo de validez (no se usa)
ALTER TABLE public."NEW_Budget" DROP COLUMN IF EXISTS valid_until;