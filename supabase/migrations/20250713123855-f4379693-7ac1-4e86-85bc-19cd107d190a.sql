-- 1. Crear la tabla principal NEW_Budget
CREATE TABLE public."NEW_Budget" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_code TEXT NOT NULL UNIQUE,
  project_id UUID REFERENCES public."NEW_Projects"(id),
  incident_id UUID REFERENCES public."NEW_Incidents"(id),
  
  -- Configuración del vehículo seleccionada
  engine_option_id UUID REFERENCES public.engine_options(id),
  model_option_id UUID REFERENCES public.model_options(id),
  exterior_color_id UUID REFERENCES public.exterior_color_options(id),
  pack_id UUID REFERENCES public."NEW_Budget_Packs"(id),
  electric_system_id UUID REFERENCES public.electric_systems(id),
  
  -- Precios calculados
  base_price NUMERIC NOT NULL DEFAULT 0,
  pack_price NUMERIC NOT NULL DEFAULT 0,
  electric_system_price NUMERIC NOT NULL DEFAULT 0,
  color_modifier NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  
  -- Metadatos
  status TEXT NOT NULL DEFAULT 'draft',
  budget_type TEXT NOT NULL DEFAULT 'project',
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Limpiar datos incorrectos de las tablas de configuración
-- Corregir precios de modelos (deben ser 0 según capturas)
UPDATE public.model_options SET price_modifier = 0;

-- Corregir precios de colores (blanco debe ser 0 según capturas)
UPDATE public.exterior_color_options SET price_modifier = 0 WHERE name = 'Blanco';

-- Limpiar packs duplicados/incorrectos en NEW_Budget_Packs
DELETE FROM public."NEW_Budget_Packs" WHERE name NOT IN ('Essential', 'Adventure', 'Ultimate');

-- Actualizar packs con nombres y precios correctos
UPDATE public."NEW_Budget_Packs" SET name = 'Essential', price = 1500 WHERE name LIKE '%Essential%';
UPDATE public."NEW_Budget_Packs" SET name = 'Adventure', price = 4000 WHERE name LIKE '%Adventure%';
UPDATE public."NEW_Budget_Packs" SET name = 'Ultimate', price = 5500 WHERE name LIKE '%Ultimate%';

-- Corregir precio de Litio+ (debe ser 2200 según capturas)
UPDATE public.electric_systems SET price = 2200 WHERE name = 'Litio+';

-- 3. Crear función para generar código de presupuesto
CREATE OR REPLACE FUNCTION public.generate_budget_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  budget_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(budget_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Budget"
  WHERE budget_code LIKE 'BG_' || year_suffix || '%';
  
  -- Format: BG_año(2 dígitos)_número secuencial(3 dígitos)
  budget_code := 'BG_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN budget_code;
END;
$$;

-- 4. Crear trigger para auto-generar código de presupuesto
CREATE OR REPLACE FUNCTION public.set_budget_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.budget_code IS NULL OR NEW.budget_code = '' THEN
    NEW.budget_code := generate_budget_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_budget_code_trigger
  BEFORE INSERT ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_budget_code();

-- 5. Crear trigger para actualizar updated_at
CREATE TRIGGER update_new_budget_updated_at
  BEFORE UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Habilitar RLS
ALTER TABLE public."NEW_Budget" ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS
CREATE POLICY "Users can view all budgets" ON public."NEW_Budget"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create budgets" ON public."NEW_Budget"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budgets" ON public."NEW_Budget"
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budgets" ON public."NEW_Budget"
  FOR DELETE USING (auth.uid() IS NOT NULL);