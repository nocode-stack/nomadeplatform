
-- Crear tabla para opciones de vehículos
CREATE TABLE public.vehicle_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  power TEXT NOT NULL,
  transmission TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para packs predefinidos
CREATE TABLE public.budget_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para componentes de packs
CREATE TABLE public.pack_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.budget_packs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_reduction NUMERIC DEFAULT 0, -- Precio que se puede restar si se quita este componente
  is_removable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir columnas a budget_items para gestionar packs y componentes personalizados
ALTER TABLE public.budget_items 
ADD COLUMN pack_id UUID REFERENCES public.budget_packs(id),
ADD COLUMN is_custom BOOLEAN DEFAULT false,
ADD COLUMN removed_components JSONB DEFAULT '[]'::jsonb;

-- Añadir columna vehicle_option_id a budgets
ALTER TABLE public.budgets 
ADD COLUMN vehicle_option_id UUID REFERENCES public.vehicle_options(id);

-- Insertar opciones de vehículos
INSERT INTO public.vehicle_options (name, power, transmission, price) VALUES
('Vehículo 140cv Manual', '140cv', 'Manual', 67500.00),
('Vehículo 180cv Automática', '180cv', 'Automática', 71500.00);

-- Insertar packs basados en la imagen
INSERT INTO public.budget_packs (name, description, price, order_index) VALUES
('Neo Essential', 'Pack básico con elementos esenciales', 1500.00, 1),
('Neo Adventure', 'Pack aventurero con funcionalidades adicionales', 4000.00, 2),
('Neo Ultimate', 'Pack completo con todas las características premium', 5500.00, 3);

-- Insertar componentes para Neo Essential
INSERT INTO public.pack_components (pack_id, name, description, price_reduction, is_removable) VALUES
((SELECT id FROM public.budget_packs WHERE name = 'Neo Essential'), 'Cama interbanco', 'Cama interbanco', 200.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Essential'), 'Ventana trasera extra', 'Ventana trasera extra', 150.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Essential'), 'Ducha exterior', 'Ducha exterior', 100.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Essential'), 'Mosquitera', 'Mosquitera', 50.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Essential'), 'Escalón eléctrico', 'Escalón eléctrico', 300.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Essential'), 'Claraboya panorámica', 'Claraboya panorámica', 250.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Essential'), 'Tarima antideslizante ducha', 'Tarima antideslizante ducha', 80.00, true);

-- Insertar componentes para Neo Adventure (incluye todos los de Essential + nuevos)
INSERT INTO public.pack_components (pack_id, name, description, price_reduction, is_removable) VALUES
-- Componentes del Essential
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Cama interbanco', 'Cama interbanco', 200.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Ventana trasera extra', 'Ventana trasera extra', 150.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Ducha exterior', 'Ducha exterior', 100.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Mosquitera', 'Mosquitera', 50.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Escalón eléctrico', 'Escalón eléctrico', 300.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Claraboya panorámica', 'Claraboya panorámica', 250.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Tarima antideslizante ducha', 'Tarima antideslizante ducha', 80.00, true),
-- Componentes nuevos del Adventure
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Rueda de repuesto', 'Rueda de repuesto', 180.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Monocontrol', 'Monocontrol', 120.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Sistema de gas GLP', 'Sistema de gas GLP', 400.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Sistema de Litio', 'Sistema de Litio', 800.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Mini extintor', 'Mini extintor', 40.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Alarma gases', 'Alarma gases', 80.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Adventure'), 'Toldo', 'Toldo', 300.00, true);

-- Insertar componentes para Neo Ultimate (incluye todos los anteriores + nuevos)
INSERT INTO public.pack_components (pack_id, name, description, price_reduction, is_removable) VALUES
-- Componentes del Essential
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Cama interbanco', 'Cama interbanco', 200.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Ventana trasera extra', 'Ventana trasera extra', 150.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Ducha exterior', 'Ducha exterior', 100.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Mosquitera', 'Mosquitera', 50.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Escalón eléctrico', 'Escalón eléctrico', 300.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Claraboya panorámica', 'Claraboya panorámica', 250.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Tarima antideslizante ducha', 'Tarima antideslizante ducha', 80.00, true),
-- Componentes del Adventure
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Rueda de repuesto', 'Rueda de repuesto', 180.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Monocontrol', 'Monocontrol', 120.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Sistema de gas GLP', 'Sistema de gas GLP', 400.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Sistema de Litio', 'Sistema de Litio', 800.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Mini extintor', 'Mini extintor', 40.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Alarma gases', 'Alarma gases', 80.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Toldo', 'Toldo', 300.00, true),
-- Componentes nuevos del Ultimate
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Pack cine: proyector + altavoces', 'Pack cine: proyector + altavoces', 600.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Candados exteriores', 'Candados exteriores', 80.00, true),
((SELECT id FROM public.budget_packs WHERE name = 'Neo Ultimate'), 'Llantas', 'Llantas', 400.00, true);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.vehicle_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_components ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Anyone can view vehicle options" 
  ON public.vehicle_options 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can view budget packs" 
  ON public.budget_packs 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can view pack components" 
  ON public.pack_components 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage vehicle options" 
  ON public.vehicle_options 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage budget packs" 
  ON public.budget_packs 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage pack components" 
  ON public.pack_components 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);
