
-- Añadir campos de facturación adicionales a la tabla clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Campos adicionales para facturación empresarial
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_company_phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_company_email TEXT;

-- Campo para indicar el tipo de facturación preferido
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_billing_type TEXT DEFAULT 'personal' CHECK (preferred_billing_type IN ('personal', 'company'));

-- Añadir comentarios para documentar los campos
COMMENT ON COLUMN public.clients.billing_phone IS 'Teléfono para facturación personal';
COMMENT ON COLUMN public.clients.billing_email IS 'Email para facturación personal';
COMMENT ON COLUMN public.clients.billing_address IS 'Dirección para facturación personal';
COMMENT ON COLUMN public.clients.billing_company_phone IS 'Teléfono de la empresa para facturación';
COMMENT ON COLUMN public.clients.billing_company_email IS 'Email de la empresa para facturación';
COMMENT ON COLUMN public.clients.preferred_billing_type IS 'Tipo de facturación preferido: personal o empresa';
