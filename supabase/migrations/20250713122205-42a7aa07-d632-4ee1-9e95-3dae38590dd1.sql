-- Primero, limpiar y configurar las opciones de modelo
DELETE FROM model_options;
INSERT INTO model_options (name, order_index, price_modifier, is_active) VALUES
('Neo', 1, 0, true),
('Neo S', 2, 5000, true),
('Neo Mini', 3, -3000, true);

-- Crear tabla para opciones de motorización si no existe
CREATE TABLE IF NOT EXISTS engine_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  power TEXT NOT NULL,
  transmission TEXT NOT NULL,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar opciones de motorización
INSERT INTO engine_options (name, power, transmission, price_modifier, order_index, is_active) VALUES
('180cv Automática', '180cv', 'Automática', 3000, 1, true),
('140cv Manual', '140cv', 'Manual', 0, 2, true);

-- Crear tabla para opciones de color exterior
CREATE TABLE IF NOT EXISTS exterior_color_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color_code TEXT,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar opciones de color exterior
INSERT INTO exterior_color_options (name, color_code, price_modifier, order_index, is_active) VALUES
('Gris', '#808080', 0, 1, true),
('Blanco', '#FFFFFF', 500, 2, true);

-- Limpiar y configurar los packs
DELETE FROM budget_packs;
INSERT INTO budget_packs (name, description, price, order_index, is_active) VALUES
('Essentials', 'Pack básico con todo lo esencial para empezar tu aventura', 2500, 1, true),
('Adventure', 'Pack intermedio con extras para explorar más', 5000, 2, true),
('Ultimate', 'Pack completo con todas las opciones premium', 8500, 3, true);

-- Limpiar y configurar sistemas eléctricos
DELETE FROM electric_systems;
INSERT INTO electric_systems (name, description, price, discount_price, order_index, is_active, is_standalone) VALUES
('Litio', 'Sistema eléctrico básico con batería de litio', 3000, null, 1, true, true),
('Litio +', 'Sistema eléctrico mejorado con mayor capacidad', 5500, null, 2, true, true),
('Pro', 'Sistema eléctrico profesional con máxima autonomía', 8000, null, 3, true, true);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE engine_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exterior_color_options ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para las nuevas tablas
CREATE POLICY "Users can view engine options" ON engine_options FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage engine options" ON engine_options FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view exterior color options" ON exterior_color_options FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage exterior color options" ON exterior_color_options FOR ALL USING (auth.uid() IS NOT NULL);