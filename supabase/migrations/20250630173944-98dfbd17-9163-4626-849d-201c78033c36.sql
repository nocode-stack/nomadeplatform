
-- Crear tabla para plantillas de contratos personalizadas
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_type TEXT NOT NULL,
  name TEXT NOT NULL,
  html_template TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_contract_templates_type ON public.contract_templates(contract_type);
CREATE INDEX idx_contract_templates_default ON public.contract_templates(contract_type, is_default);

-- Habilitar RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - todos pueden ver las plantillas
CREATE POLICY "Anyone can view contract templates" 
  ON public.contract_templates 
  FOR SELECT 
  USING (true);

-- Solo usuarios autenticados pueden crear plantillas
CREATE POLICY "Authenticated users can create contract templates" 
  ON public.contract_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo el creador puede actualizar sus plantillas
CREATE POLICY "Users can update their own contract templates" 
  ON public.contract_templates 
  FOR UPDATE 
  USING (created_by = auth.uid());

-- Solo el creador puede eliminar sus plantillas
CREATE POLICY "Users can delete their own contract templates" 
  ON public.contract_templates 
  FOR DELETE 
  USING (created_by = auth.uid());

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_templates_updated_at_trigger
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_templates_updated_at();

-- Insertar plantillas por defecto basadas en las actuales
INSERT INTO public.contract_templates (contract_type, name, html_template, is_default) VALUES
('reservation_contract', 'Contrato de Reserva - Plantilla Base', 
  '<h1>CONTRATO DE RESERVA</h1>
   <p><strong>Cliente:</strong> {{client_name}}</p>
   <p><strong>DNI:</strong> {{client_dni}}</p>  
   <p><strong>Teléfono:</strong> {{client_phone}}</p>
   <p><strong>Email:</strong> {{client_email}}</p>
   <p><strong>Dirección:</strong> {{client_address}}</p>
   
   <h2>VEHÍCULO RESERVADO</h2>
   <p><strong>Modelo:</strong> {{model}}</p>
   <p><strong>Motorización:</strong> {{power}}</p>
   <p><strong>Color Interior:</strong> {{interior_color}}</p>
   <p><strong>Color Exterior:</strong> {{exterior_color}}</p>
   
   <h2>CONDICIONES ECONÓMICAS</h2>
   <p><strong>Importe Total:</strong> {{total_amount}}</p>
   
   <p><strong>Código de Proyecto:</strong> {{project_code}}</p>
   <p><strong>Fecha:</strong> {{current_date}}</p>', 
  true),

('purchase_agreement', 'Acuerdo de Compra-venta - Plantilla Base',
  '<h1>ACUERDO DE COMPRA-VENTA</h1>
   <p><strong>Cliente:</strong> {{client_name}}</p>
   <p><strong>DNI:</strong> {{client_dni}}</p>
   <p><strong>Teléfono:</strong> {{client_phone}}</p>
   <p><strong>Email:</strong> {{client_email}}</p>
   <p><strong>Dirección:</strong> {{client_address}}</p>
   
   <h2>OBJETO DEL ACUERDO</h2>
   <p><strong>Modelo:</strong> {{model}}</p>
   <p><strong>Motorización:</strong> {{power}}</p>
   <p><strong>Color Interior:</strong> {{interior_color}}</p>
   <p><strong>Color Exterior:</strong> {{exterior_color}}</p>
   
   <h2>PRECIO Y FORMA DE PAGO</h2>
   <p><strong>Precio Total:</strong> {{total_amount}}</p>
   
   <p><strong>Código de Proyecto:</strong> {{project_code}}</p>
   <p><strong>Fecha:</strong> {{current_date}}</p>',
  true),
  
('sale_contract', 'Contrato de Compraventa - Plantilla Base',
  '<h1>CONTRATO DE COMPRAVENTA</h1>
   <p><strong>Comprador:</strong> {{client_name}}</p>
   <p><strong>DNI:</strong> {{client_dni}}</p>
   <p><strong>Teléfono:</strong> {{client_phone}}</p>
   <p><strong>Email:</strong> {{client_email}}</p>
   <p><strong>Dirección:</strong> {{client_address}}</p>
   
   <h2>VEHÍCULO OBJETO DE LA COMPRAVENTA</h2>
   <p><strong>Modelo:</strong> {{model}}</p>
   <p><strong>Motorización:</strong> {{power}}</p>
   <p><strong>Color Interior:</strong> {{interior_color}}</p>
   <p><strong>Color Exterior:</strong> {{exterior_color}}</p>
   
   <h2>PRECIO</h2>
   <p><strong>Precio de Venta:</strong> {{total_amount}}</p>
   
   <p><strong>Código de Proyecto:</strong> {{project_code}}</p>
   <p><strong>Fecha:</strong> {{current_date}}</p>',
  true);
