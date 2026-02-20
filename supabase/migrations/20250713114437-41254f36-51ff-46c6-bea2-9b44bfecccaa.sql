-- Create NEW_Budget_Concepts table
CREATE TABLE public."NEW_Budget_Concepts" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public."NEW_Budget_Concepts" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all budget concepts" 
ON public."NEW_Budget_Concepts" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create budget concepts" 
ON public."NEW_Budget_Concepts" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budget concepts" 
ON public."NEW_Budget_Concepts" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budget concepts" 
ON public."NEW_Budget_Concepts" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at column
CREATE TRIGGER trigger_update_new_budget_concepts_updated_at
BEFORE UPDATE ON public."NEW_Budget_Concepts"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_new_budget_concepts_category ON public."NEW_Budget_Concepts"(category);
CREATE INDEX idx_new_budget_concepts_is_active ON public."NEW_Budget_Concepts"(is_active);
CREATE INDEX idx_new_budget_concepts_category_active ON public."NEW_Budget_Concepts"(category, is_active);

-- Insert some sample data to match existing budget_concepts
INSERT INTO public."NEW_Budget_Concepts" (category, subcategory, name, price, is_active) VALUES
('Vehículo', 'Modelo', 'Fiat Ducato L2H2', 35000.00, true),
('Vehículo', 'Modelo', 'Mercedes Sprinter 314', 42000.00, true),
('Vehículo', 'Modelo', 'Iveco Daily 35S14', 38000.00, true),
('Electricidad', 'Sistema', 'Sistema eléctrico básico', 2500.00, true),
('Electricidad', 'Sistema', 'Sistema eléctrico avanzado', 4500.00, true),
('Electricidad', 'Luces', 'Luces LED interiores', 350.00, true),
('Electricidad', 'Tomas', 'Tomas USB dobles', 150.00, true),
('Confort', 'Mobiliario', 'Color mobiliario beige', 0.00, true),
('Confort', 'Mobiliario', 'Color mobiliario marrón', 200.00, true),
('Confort', 'Mobiliario', 'Color mobiliario negro', 300.00, true),
('Paquetes', 'Extra', 'Paquete confort básico', 1500.00, true),
('Paquetes', 'Extra', 'Paquete confort premium', 3000.00, true),
('Motor', 'Potencia', '140CV Diesel', 0.00, true),
('Motor', 'Potencia', '170CV Diesel', 2500.00, true),
('Motor', 'Potencia', '180CV Diesel', 3500.00, true);