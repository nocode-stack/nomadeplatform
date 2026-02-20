-- Crear tabla para información de la empresa
CREATE TABLE public."NEW_Nomade_Info" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'Nomade Nation, S.L.',
  nif TEXT NOT NULL DEFAULT 'B09622879',
  address TEXT NOT NULL DEFAULT 'c/ Telemàtica 16-18',
  city TEXT NOT NULL DEFAULT 'Montcada i Reixac (08110)',
  bank_santander TEXT NOT NULL DEFAULT 'ES2300491873652010517965',
  bank_sabadell TEXT NOT NULL DEFAULT 'ES80 0081 7011 1900 0384 8192',
  legal_text TEXT NOT NULL DEFAULT 'Este presupuesto no incluye impuestos de matriculación. Este importe se deberá abonar por parte del cliente una vez comprado el vehículo. El importe de matriculación puede variar según la antigüedad del vehículo, quedando exentos, personas con un 30% o más de discapacidad, personas con dependencia, autónomos o empresas.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Insertar datos iniciales
INSERT INTO public."NEW_Nomade_Info" (
  company_name,
  nif,
  address,
  city,
  bank_santander,
  bank_sabadell,
  legal_text
) VALUES (
  'Nomade Nation, S.L.',
  'B09622879',
  'c/ Telemàtica 16-18',
  'Montcada i Reixac (08110)',
  'ES2300491873652010517965',
  'ES80 0081 7011 1900 0384 8192',
  'Este presupuesto no incluye impuestos de matriculación. Este importe se deberá abonar por parte del cliente una vez comprado el vehículo. El importe de matriculación puede variar según la antigüedad del vehículo, quedando exentos, personas con un 30% o más de discapacidad, personas con dependencia, autónomos o empresas.'
);

-- Habilitar RLS
ALTER TABLE public."NEW_Nomade_Info" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Authenticated users can view company info" 
ON public."NEW_Nomade_Info" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage company info" 
ON public."NEW_Nomade_Info" 
FOR ALL 
USING (auth.uid() IS NOT NULL);