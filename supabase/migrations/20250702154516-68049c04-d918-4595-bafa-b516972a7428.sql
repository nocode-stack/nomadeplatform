
-- Crear tabla para sistemas eléctricos
CREATE TABLE public.electric_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC DEFAULT 0,
  is_standalone BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para componentes extras
CREATE TABLE public.extra_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar sistemas eléctricos
INSERT INTO public.electric_systems (name, description, price, discount_price, order_index) VALUES
('Sistema Litio', 'Sistema eléctrico con batería de litio de alta capacidad', 3500, 0, 1),
('Sistema AGM', 'Sistema eléctrico con baterías AGM estándar', 2500, 1500, 2),
('Sistema Solar Plus', 'Sistema completo con paneles solares y regulador MPPT', 4500, 3500, 3);

-- Insertar componentes extras
INSERT INTO public.extra_components (name, description, price, category) VALUES
('Aire Acondicionado', 'Sistema de aire acondicionado para furgoneta', 1200, 'Confort'),
('Microondas', 'Microondas compacto de 20L', 180, 'Cocina'),
('Toldo Fiamma', 'Toldo lateral automático de 3 metros', 850, 'Exterior'),
('Portabicis', 'Soporte trasero para 2 bicicletas', 320, 'Exterior'),
('Nevera Compresora', 'Nevera de 65L con compresor de bajo consumo', 650, 'Interior'),
('Calefacción Webasto', 'Sistema de calefacción diésel auxiliar', 1200, 'Confort');

-- Habilitar RLS para electric_systems
ALTER TABLE public.electric_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view electric systems" 
  ON public.electric_systems 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage electric systems" 
  ON public.electric_systems 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Habilitar RLS para extra_components
ALTER TABLE public.extra_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view extra components" 
  ON public.extra_components 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can manage extra components" 
  ON public.extra_components 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);
