-- Crear tabla NEW_Contracts para gestión de contratos
CREATE TABLE public."NEW_Contracts" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  client_id UUID NOT NULL,
  contract_type TEXT NOT NULL,
  contract_status TEXT NOT NULL DEFAULT 'draft',
  signaturit_id TEXT,
  client_full_name TEXT NOT NULL,
  client_dni TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  billing_entity_name TEXT,
  billing_entity_nif TEXT,
  billing_address TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_vin TEXT,
  vehicle_plate TEXT,
  total_price NUMERIC NOT NULL,
  payment_reserve NUMERIC,
  payment_second NUMERIC,
  payment_final NUMERIC,
  payment_conditions TEXT,
  iban TEXT NOT NULL,
  signed_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear relaciones de clave externa
ALTER TABLE public."NEW_Contracts" 
ADD CONSTRAINT NEW_Contracts_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public."NEW_Projects"(id) ON DELETE CASCADE;

ALTER TABLE public."NEW_Contracts" 
ADD CONSTRAINT NEW_Contracts_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public."NEW_Clients"(id) ON DELETE CASCADE;

-- Habilitar Row Level Security
ALTER TABLE public."NEW_Contracts" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view all contracts" 
ON public."NEW_Contracts" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create contracts" 
ON public."NEW_Contracts" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contracts" 
ON public."NEW_Contracts" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contracts" 
ON public."NEW_Contracts" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_new_contracts_updated_at
BEFORE UPDATE ON public."NEW_Contracts"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejor rendimiento
CREATE INDEX idx_new_contracts_project_id ON public."NEW_Contracts"(project_id);
CREATE INDEX idx_new_contracts_client_id ON public."NEW_Contracts"(client_id);
CREATE INDEX idx_new_contracts_status ON public."NEW_Contracts"(contract_status);
CREATE INDEX idx_new_contracts_type ON public."NEW_Contracts"(contract_type);