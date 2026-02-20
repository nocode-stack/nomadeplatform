-- Eliminar la foreign key existente y recrearla con CASCADE
ALTER TABLE public."NEW_Billing" 
DROP CONSTRAINT IF EXISTS "NEW_Billing_client_id_fkey";

-- Recrear la foreign key con ON DELETE CASCADE
ALTER TABLE public."NEW_Billing" 
ADD CONSTRAINT "NEW_Billing_client_id_fkey" 
FOREIGN KEY (client_id) 
REFERENCES public."NEW_Clients"(id) 
ON DELETE CASCADE;