
-- Arreglar la restricción de preferred_billing_type en la tabla clients
ALTER TABLE public.clients 
DROP CONSTRAINT IF EXISTS clients_preferred_billing_type_check;

-- Crear una nueva restricción con los valores correctos
ALTER TABLE public.clients 
ADD CONSTRAINT clients_preferred_billing_type_check 
CHECK (preferred_billing_type IN ('personal', 'company', 'client', 'custom'));

-- Actualizar cualquier valor existente que pueda estar mal
UPDATE public.clients 
SET preferred_billing_type = 'personal' 
WHERE preferred_billing_type NOT IN ('personal', 'company', 'client', 'custom');
