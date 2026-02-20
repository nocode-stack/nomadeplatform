-- Crear tabla NEW_Budget_Electric para sistemas eléctricos del nuevo sistema de presupuestos
CREATE TABLE public."NEW_Budget_Electric" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_type TEXT NOT NULL DEFAULT 'basic', -- basic, advanced, premium
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price NUMERIC(10,2) DEFAULT NULL, -- precio con descuento si aplica
  required_packs TEXT[], -- array de IDs de packs requeridos
  is_standalone BOOLEAN NOT NULL DEFAULT true, -- si puede funcionar independiente
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir índices para mejor rendimiento
CREATE INDEX idx_new_budget_electric_active ON public."NEW_Budget_Electric" (is_active);
CREATE INDEX idx_new_budget_electric_order ON public."NEW_Budget_Electric" (order_index);
CREATE INDEX idx_new_budget_electric_type ON public."NEW_Budget_Electric" (system_type);

-- Insertar sistemas eléctricos básicos
INSERT INTO public."NEW_Budget_Electric" (name, description, system_type, price, is_standalone, order_index) VALUES
('Sin sistema eléctrico', 'Vehículo sin sistema eléctrico adicional', 'none', 0, true, 0),
('Sistema Básico Litio', 'Sistema eléctrico básico con batería de litio', 'basic', 2500, true, 1),
('Sistema Avanzado', 'Sistema eléctrico avanzado con características mejoradas', 'advanced', 4500, false, 2),
('Sistema Premium', 'Sistema eléctrico premium con todas las características', 'premium', 7500, false, 3);

-- Crear políticas RLS
ALTER TABLE public."NEW_Budget_Electric" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all electric systems" 
ON public."NEW_Budget_Electric" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create electric systems" 
ON public."NEW_Budget_Electric" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update electric systems" 
ON public."NEW_Budget_Electric" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete electric systems" 
ON public."NEW_Budget_Electric" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Crear trigger para updated_at
CREATE TRIGGER update_new_budget_electric_updated_at
    BEFORE UPDATE ON public."NEW_Budget_Electric"
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();