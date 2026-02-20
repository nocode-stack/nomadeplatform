-- Create NEW_Budget_Packs table
CREATE TABLE public."NEW_Budget_Packs" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public."NEW_Budget_Packs" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all budget packs" 
ON public."NEW_Budget_Packs" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create budget packs" 
ON public."NEW_Budget_Packs" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budget packs" 
ON public."NEW_Budget_Packs" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budget packs" 
ON public."NEW_Budget_Packs" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at column
CREATE TRIGGER trigger_update_new_budget_packs_updated_at
BEFORE UPDATE ON public."NEW_Budget_Packs"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_new_budget_packs_is_active ON public."NEW_Budget_Packs"(is_active);
CREATE INDEX idx_new_budget_packs_name ON public."NEW_Budget_Packs"(name);

-- Insert some sample data
INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Pack Adventure', 'Paquete completo para aventuras con nevera, mesa, camas y almacenamiento', 3500.00, true),
('Pack Business', 'Diseño profesional con oficina móvil y conectividad avanzada', 4200.00, true),
('Pack Family', 'Ideal para familias con literas, zona de juegos y almacenamiento extra', 2800.00, true),
('Pack Off-Road', 'Equipamiento especializado para terrenos difíciles', 1800.00, true),
('Pack Básico', 'Configuración esencial para comenzar la aventura', 1200.00, true);