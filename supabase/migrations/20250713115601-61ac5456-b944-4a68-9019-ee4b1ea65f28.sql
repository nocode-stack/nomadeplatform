-- Create NEW_Budget_Default_Components table
CREATE TABLE public."NEW_Budget_Default_Components" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  included_in_base BOOLEAN NOT NULL DEFAULT true,
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
CREATE INDEX idx_new_budget_default_components_category_base ON public."NEW_Budget_Default_Components"(category, included_in_base);

-- Insert some sample default components
INSERT INTO public."NEW_Budget_Default_Components" (name, category, description, included_in_base) VALUES
('Vehículo Base', 'vehiculo', 'Vehículo comercial base sin modificaciones', true),
('Instalación Eléctrica Básica', 'electrico', 'Sistema eléctrico básico estándar', true),
('Certificación CE', 'certificacion', 'Certificación CE obligatoria para Europa', true),
('Manual de Usuario', 'documentacion', 'Manual básico de operación del vehículo', true),
('Garantía Estándar', 'garantia', 'Garantía básica de 2 años', true),
('Kit de Herramientas', 'accesorios', 'Kit básico de herramientas incluido', false),
('Extintor', 'seguridad', 'Extintor de seguridad básico', false),
('Botiquín Primeros Auxilios', 'seguridad', 'Kit básico de primeros auxilios', false),
('Triángulos de Emergencia', 'seguridad', 'Triángulos reflectantes de emergencia', false),
('Chaleco Reflectante', 'seguridad', 'Chaleco de alta visibilidad', false);