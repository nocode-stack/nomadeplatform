
-- Crear tabla para conceptos base de presupuestos
CREATE TABLE public.budget_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'base', 'modelo', 'color_interior', 'opcionales', 'sistema_electrico', 'otros'
  subcategory TEXT, -- Para agrupar conceptos dentro de una categoría
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para presupuestos
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  budget_number TEXT NOT NULL, -- Número de presupuesto generado automáticamente
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  client_dni TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  iva_rate DECIMAL(4,2) NOT NULL DEFAULT 21.00, -- Porcentaje de IVA
  iva_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  iemdt_amount DECIMAL(10,2) DEFAULT 0, -- Impuesto especial
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'approved', 'rejected'
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para items de presupuesto
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.budget_concepts(id),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  discount_percentage DECIMAL(4,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar conceptos base basados en el presupuesto de ejemplo
INSERT INTO public.budget_concepts (category, subcategory, name, description, price) VALUES
-- BASE
('base', 'vehiculo', 'Fiat Ducato 9.2', 'Camperización', 31800.00),

-- MODELO
('modelo', null, 'Neo', 'Modelo Neo', 0.00),
('modelo', null, 'Neo S', 'Modelo Neo S', 0.00),

-- COLOR INTERIOR
('color_interior', null, 'Gris oscuro y madera', 'Color interior muebles', 0.00),
('color_interior', null, 'Blanco y madera', 'Color interior muebles', 0.00),

-- OPCIONALES
('opcionales', 'neo_essential', 'Neo Essential Pack', 'Pack esencial', 1300.00),
('opcionales', 'neo_essential', 'Cama interbanco', 'Cama adicional interbanco', 0.00),
('opcionales', 'neo_essential', 'Ventana trasera extra', 'Ventana adicional trasera', 0.00),
('opcionales', 'neo_essential', 'Ducha exterior', 'Ducha para uso exterior', 0.00),
('opcionales', 'neo_essential', 'Mosquitera', 'Mosquitera para ventanas', 0.00),
('opcionales', 'neo_essential', 'Escalón eléctrico', 'Escalón automático eléctrico', 0.00),
('opcionales', 'neo_essential', 'Claraboya panorámica', 'Claraboya con vista panorámica', 0.00),
('opcionales', 'neo_essential', 'Tarima antideslizante', 'Suelo antideslizante', 0.00),

('opcionales', 'neo_adventure', 'Neo Adventure Pack', 'Pack aventura', 4000.00),
('opcionales', 'neo_adventure', 'Neo Essential Pack', 'Incluye Essential Pack', 0.00),
('opcionales', 'neo_adventure', 'Rueda de repuesto', 'Rueda de repuesto adicional', 0.00),
('opcionales', 'neo_adventure', 'Monocontrol', 'Sistema monocontrol gas', 0.00),
('opcionales', 'neo_adventure', 'Gas GLP', 'Sistema de gas GLP', 0.00),
('opcionales', 'neo_adventure', 'Litio 100', 'Batería de litio 100Ah', 0.00),
('opcionales', 'neo_adventure', 'Mini extintor', 'Extintor de seguridad', 0.00),
('opcionales', 'neo_adventure', 'Alarma gases', 'Detector de gases', 0.00),
('opcionales', 'neo_adventure', 'Toldo', 'Toldo exterior', 0.00),

('opcionales', 'neo_ultimate', 'Neo Ultimate Pack', 'Pack ultimate', 5500.00),
('opcionales', 'neo_ultimate', 'Neo Essential Pack', 'Incluye Essential Pack', 0.00),
('opcionales', 'neo_ultimate', 'Neo Adventure Pack', 'Incluye Adventure Pack', 0.00),
('opcionales', 'neo_ultimate', 'Pack cine: altavoces JBL + proyector', 'Sistema de entretenimiento', 0.00),
('opcionales', 'neo_ultimate', 'Candados', 'Sistema de seguridad con candados', 0.00),
('opcionales', 'neo_ultimate', 'Llantas', 'Llantas de aleación', 0.00),

-- SISTEMA ELÉCTRICO
('sistema_electrico', null, 'Sistema eléctrico Lilio', 'Sistema eléctrico básico', 990.00),
('sistema_electrico', null, 'Sistema eléctrico Lilio +', 'Sistema eléctrico avanzado', 2200.00),
('sistema_electrico', null, 'Sistema eléctrico Pro', 'Sistema eléctrico profesional', 2800.00),

-- OTROS
('otros', null, 'Microondas', 'Microondas integrado', 220.00),
('otros', null, 'Aire Acondicionado Dometic', 'Sistema de aire acondicionado', 1500.00);

-- Función para generar número de presupuesto
CREATE OR REPLACE FUNCTION public.generate_budget_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  budget_number TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(budget_number, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM budgets
  WHERE budget_number LIKE 'PRE' || year_suffix || '%';
  
  -- Format: PRE + año(2 dígitos) + número secuencial(3 dígitos)
  budget_number := 'PRE' || year_suffix || LPAD(next_number::TEXT, 3, '0');
  
  RETURN budget_number;
END;
$$;

-- Trigger para generar número de presupuesto automáticamente
CREATE OR REPLACE FUNCTION public.set_budget_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.budget_number IS NULL OR NEW.budget_number = '' THEN
    NEW.budget_number := generate_budget_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_budget_number
  BEFORE INSERT ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION set_budget_number();

-- Trigger para actualizar totales del presupuesto
CREATE OR REPLACE FUNCTION public.update_budget_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  budget_subtotal DECIMAL(10,2);
  budget_iva_amount DECIMAL(10,2);
  budget_total DECIMAL(10,2);
  iva_rate DECIMAL(4,2);
BEGIN
  -- Obtener la tasa de IVA del presupuesto
  SELECT b.iva_rate INTO iva_rate
  FROM budgets b
  WHERE b.id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Calcular subtotal
  SELECT COALESCE(SUM(line_total), 0)
  INTO budget_subtotal
  FROM budget_items
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Calcular IVA
  budget_iva_amount := budget_subtotal * (iva_rate / 100);
  
  -- Calcular total
  budget_total := budget_subtotal + budget_iva_amount;
  
  -- Actualizar presupuesto
  UPDATE budgets
  SET 
    subtotal = budget_subtotal,
    iva_amount = budget_iva_amount,
    total = budget_total,
    updated_at = now()
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_budget_totals_insert
  AFTER INSERT ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_totals();

CREATE TRIGGER trigger_update_budget_totals_update
  AFTER UPDATE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_totals();

CREATE TRIGGER trigger_update_budget_totals_delete
  AFTER DELETE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_totals();

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_budget_concepts_updated_at
  BEFORE UPDATE ON public.budget_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.budget_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Políticas para budget_concepts
CREATE POLICY "Anyone can view budget concepts" ON public.budget_concepts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage budget concepts" ON public.budget_concepts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para budgets
CREATE POLICY "Users can view budgets" ON public.budgets
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update budgets" ON public.budgets
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete budgets" ON public.budgets
  FOR DELETE USING (true);

-- Políticas para budget_items
CREATE POLICY "Users can view budget items" ON public.budget_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage budget items" ON public.budget_items
  FOR ALL USING (auth.uid() IS NOT NULL);
