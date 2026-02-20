
-- Verificar si las tablas existen y crearlas si no existen
-- Crear tabla para sistemas eléctricos si no existe
CREATE TABLE IF NOT EXISTS public.electric_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC DEFAULT 0,
  is_standalone BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para componentes extras si no existe
CREATE TABLE IF NOT EXISTS public.extra_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Limpiar datos existentes para evitar duplicados
DELETE FROM public.electric_systems;
DELETE FROM public.extra_components;

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

-- Habilitar RLS para electric_systems si no está habilitado
ALTER TABLE public.electric_systems ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'electric_systems' AND policyname = 'Anyone can view electric systems') THEN
        CREATE POLICY "Anyone can view electric systems" 
          ON public.electric_systems 
          FOR SELECT 
          USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'electric_systems' AND policyname = 'Authenticated users can manage electric systems') THEN
        CREATE POLICY "Authenticated users can manage electric systems" 
          ON public.electric_systems 
          FOR ALL 
          USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Habilitar RLS para extra_components si no está habilitado
ALTER TABLE public.extra_components ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extra_components' AND policyname = 'Anyone can view extra components') THEN
        CREATE POLICY "Anyone can view extra components" 
          ON public.extra_components 
          FOR SELECT 
          USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'extra_components' AND policyname = 'Authenticated users can manage extra components') THEN
        CREATE POLICY "Authenticated users can manage extra components" 
          ON public.extra_components 
          FOR ALL 
          USING (auth.uid() IS NOT NULL);
    END IF;
END $$;
