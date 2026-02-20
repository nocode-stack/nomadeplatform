
-- Crear tabla para opciones de modelo
CREATE TABLE public.model_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para opciones de color interior
CREATE TABLE public.interior_color_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar opciones de modelo
INSERT INTO public.model_options (name, description, price_modifier, order_index) VALUES
('Neo', 'Modelo básico Neo', 0, 1),
('Neo S', 'Modelo Neo S estándar', 0, 2),
('Neo Mini', 'Modelo Neo Mini compacto', 0, 3);

-- Insertar opciones de color interior
INSERT INTO public.interior_color_options (name, description, price, order_index) VALUES
('Blanco', 'Color blanco para mobiliario interior', 0, 1),
('Gris', 'Color gris para mobiliario interior', 0, 2);

-- Habilitar RLS para model_options
ALTER TABLE public.model_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view model options" 
  ON public.model_options 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage model options" 
  ON public.model_options 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Habilitar RLS para interior_color_options
ALTER TABLE public.interior_color_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interior color options" 
  ON public.interior_color_options 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage interior color options" 
  ON public.interior_color_options 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);
