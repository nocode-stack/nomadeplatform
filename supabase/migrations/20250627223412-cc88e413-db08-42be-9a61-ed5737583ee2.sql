
-- Crear tabla para almacenar contratos
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT 'purchase_agreement',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_to_send', 'sent', 'signed', 'expired')),
  template_data JSONB DEFAULT '{}',
  pdf_url TEXT,
  signature_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Agregar trigger para actualizar updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Política para ver contratos (todos los usuarios autenticados pueden ver)
CREATE POLICY "Users can view contracts" 
  ON public.contracts 
  FOR SELECT 
  USING (true);

-- Política para crear contratos (todos los usuarios autenticados pueden crear)
CREATE POLICY "Users can create contracts" 
  ON public.contracts 
  FOR INSERT 
  WITH CHECK (true);

-- Política para actualizar contratos (todos los usuarios autenticados pueden actualizar)
CREATE POLICY "Users can update contracts" 
  ON public.contracts 
  FOR UPDATE 
  USING (true);

-- Crear bucket para almacenar PDFs de contratos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- Política para el bucket de contratos - permitir a todos los usuarios autenticados subir y ver
CREATE POLICY "Anyone can upload contract files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Anyone can view contract files"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts');
