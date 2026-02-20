-- Primero, actualizar las referencias existentes a NULL
UPDATE public."NEW_Budget" SET pack_id = NULL;

-- Ahora actualizar los datos de la tabla NEW_Budget_Electric con los sistemas correctos
DELETE FROM public."NEW_Budget_Electric";

INSERT INTO public."NEW_Budget_Electric" (name, description, system_type, price, is_standalone, order_index) VALUES
('Sistema Litio', 'Batería de litio (100Ah), Placa solar monocristalina (200W), Inversor Multiplus 500W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 75/15. *Incluido en el paquete Adventure y Ultimate', 'basic', 990, true, 1),
('Sistema Litio+', 'Dos baterías de litio (200Ah), Placa solar monocristalina (200W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30. Al escoger el paquete Adventure o Ultimate: 1.210€', 'advanced', 2200, true, 2),
('Sistema Pro', 'Dos baterías de litio (400Ah), Doble placa solar monocristalina (400W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30. Al escoger el paquete Adventure o Ultimate: 1.810€', 'premium', 2800, true, 3);

-- Actualizar los packs para que sean solo Essentials, Adventure y Ultimate
DELETE FROM public."NEW_Budget_Packs";

INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Essentials', 'Pack básico con las características esenciales', 2500, true),
('Adventure', 'Pack intermedio para aventureros', 4500, true),
('Ultimate', 'Pack completo con todas las características premium', 7500, true);

-- Crear tabla para items adicionales (aire acondicionado, microondas, etc.)
CREATE TABLE public."NEW_Budget_Additional_Items" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'comfort', -- comfort, appliances, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir índices
CREATE INDEX idx_new_budget_additional_items_active ON public."NEW_Budget_Additional_Items" (is_active);
CREATE INDEX idx_new_budget_additional_items_category ON public."NEW_Budget_Additional_Items" (category);

-- Insertar items adicionales
INSERT INTO public."NEW_Budget_Additional_Items" (name, description, category, price, order_index) VALUES
('Aire Acondicionado', 'Sistema de aire acondicionado para el vehículo', 'comfort', 1500, 1),
('Microondas', 'Microondas integrado en la cocina', 'appliances', 800, 2);

-- Crear políticas RLS para items adicionales
ALTER TABLE public."NEW_Budget_Additional_Items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all additional items" 
ON public."NEW_Budget_Additional_Items" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create additional items" 
ON public."NEW_Budget_Additional_Items" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update additional items" 
ON public."NEW_Budget_Additional_Items" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete additional items" 
ON public."NEW_Budget_Additional_Items" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Crear trigger para updated_at
CREATE TRIGGER update_new_budget_additional_items_updated_at
    BEFORE UPDATE ON public."NEW_Budget_Additional_Items"
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();