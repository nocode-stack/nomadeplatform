-- Crear tabla para opciones de color de mobiliario
CREATE TABLE public.interior_color_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar opciones por defecto (gris y blanco)
INSERT INTO public.interior_color_options (name, color_code, order_index, price_modifier) VALUES
('Gris', '#808080', 1, 0),
('Blanco', '#FFFFFF', 2, 0);

-- Añadir columna interior_color_id a la tabla NEW_Budget
ALTER TABLE public."NEW_Budget" 
ADD COLUMN interior_color_id UUID REFERENCES public.interior_color_options(id);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.interior_color_options ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para interior_color_options
CREATE POLICY "Users can view interior color options" 
ON public.interior_color_options 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage interior color options" 
ON public.interior_color_options 
FOR ALL 
USING (auth.uid() IS NOT NULL);