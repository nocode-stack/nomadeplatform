-- Create NEW_Budget_Default_Components table
CREATE TABLE public."NEW_Budget_Default_Components" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  included_in_base BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public."NEW_Budget_Default_Components" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all budget default components" 
ON public."NEW_Budget_Default_Components" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create budget default components" 
ON public."NEW_Budget_Default_Components" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budget default components" 
ON public."NEW_Budget_Default_Components" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budget default components" 
ON public."NEW_Budget_Default_Components" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at column
CREATE TRIGGER trigger_update_new_budget_default_components_updated_at
BEFORE UPDATE ON public."NEW_Budget_Default_Components"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_new_budget_default_components_category ON public."NEW_Budget_Default_Components"(category);
CREATE INDEX idx_new_budget_default_components_included_in_base ON public."NEW_Budget_Default_Components"(included_in_base);
CREATE INDEX idx_new_budget_default_components_name ON public."NEW_Budget_Default_Components"(name);

-- Insert some sample default components
INSERT INTO public."NEW_Budget_Default_Components" (name, category, description, included_in_base) VALUES
-- Componentes incluidos de serie
('Nevera 90L', 'electricidad', 'Nevera de compresor de 90 litros con eficiencia energética', true),
('Claraboya', 'mobiliario', 'Claraboya con apertura y ventilación incluida', true),
('Luces LED básicas', 'electricidad', 'Sistema de iluminación LED interior básico', true),
('Aislamiento térmico', 'estructura', 'Aislamiento completo de paredes, suelo y techo', true),
('Suelo vinílico', 'mobiliario', 'Suelo antideslizante resistente al agua', true),
('Ventilación forzada', 'electricidad', 'Extractor de aire con control automático', true),

-- Componentes opcionales
('Calefacción estacionaria', 'calefacción', 'Sistema de calefacción independiente diesel/gasolina', false),
('Ducha exterior', 'agua', 'Ducha exterior con manguera extensible', false),
('Toldo lateral', 'exterior', 'Toldo retráctil lateral de 3 metros', false),
('Mesa exterior', 'mobiliario', 'Mesa plegable para uso exterior', false),
('Sistema solar 200W', 'electricidad', 'Panel solar con regulador e instalación completa', false),
('Cama elevable', 'mobiliario', 'Mecanismo de cama elevable hidráulico', false);