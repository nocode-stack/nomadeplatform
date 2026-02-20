-- Crear los 3 packs principales
INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Neo Essential', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha', 1500, true),
('Neo Adventure', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha, Rueda de repuesto, Monocontrol, Sistema de gas GLP, Sistema de Litio, Mini extintor, Alarma gases, Toldo', 4000, true),
('Neo Ultimate', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha, Rueda de repuesto, Monocontrol, Sistema de gas GLP, Sistema de Litio, Mini extintor, Alarma gases, Toldo, Pack cine: proyector + altavoces, Candados exteriores, Llantas', 5500, true)
ON CONFLICT (name) DO UPDATE SET
description = EXCLUDED.description,
price = EXCLUDED.price,
is_active = EXCLUDED.is_active;

-- Actualizar sistemas eléctricos con precios correctos y lógica de descuento
UPDATE public."electric_systems" SET 
name = 'Sistema Litio',
description = 'Batería de litio (100Ah), Placa solar monocristalina (200W), Inversor Multiplus 500W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 75/15',
price = 990,
discount_price = 0, -- Incluido en Adventure y Ultimate
order_index = 1,
is_standalone = false -- No es standalone porque viene incluido en packs
WHERE name LIKE '%Litio%' OR id = (SELECT id FROM public."electric_systems" WHERE name LIKE '%Litio%' LIMIT 1);

-- Si no existe Sistema Litio, crearlo
INSERT INTO public."electric_systems" (name, description, price, discount_price, order_index, is_standalone, is_active)
SELECT 'Sistema Litio', 'Batería de litio (100Ah), Placa solar monocristalina (200W), Inversor Multiplus 500W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 75/15', 990, 0, 1, false, true
WHERE NOT EXISTS (SELECT 1 FROM public."electric_systems" WHERE name = 'Sistema Litio');

-- Crear Sistema Litio+
INSERT INTO public."electric_systems" (name, description, price, discount_price, order_index, is_standalone, is_active) VALUES
('Sistema Litio+', 'Dos baterías de litio (200Ah), Placa solar monocristalina (200W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30', 2200, 1210, 2, true, true)
ON CONFLICT (name) DO UPDATE SET
description = EXCLUDED.description,
price = EXCLUDED.price,
discount_price = EXCLUDED.discount_price,
order_index = EXCLUDED.order_index,
is_standalone = EXCLUDED.is_standalone,
is_active = EXCLUDED.is_active;

-- Crear Sistema Pro
INSERT INTO public."electric_systems" (name, description, price, discount_price, order_index, is_standalone, is_active) VALUES
('Sistema Pro', 'Dos baterías de litio (400Ah), Doble placa solar monocristalina (400W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30', 2800, 1810, 3, true, true)
ON CONFLICT (name) DO UPDATE SET
description = EXCLUDED.description,
price = EXCLUDED.price,
discount_price = EXCLUDED.discount_price,
order_index = EXCLUDED.order_index,
is_standalone = EXCLUDED.is_standalone,
is_active = EXCLUDED.is_active;

-- Crear los extras adicionales
INSERT INTO public."extra_components" (name, description, price, category, is_active) VALUES
('Microondas integrados', 'Microonda integrados con capacidad de 20L, revestimiento Ready2Clean y 6 niveles de funcionamiento', 200, 'Electrodomésticos', true),
('Aire acondicionado Dometic FreshJet 2200', 'Aire acondicionado Dometic FreshJet 2200 con control remoto, flujo ajustable y bomba de calor', 1500, 'Climatización', true)
ON CONFLICT (name) DO UPDATE SET
description = EXCLUDED.description,
price = EXCLUDED.price,
category = EXCLUDED.category,
is_active = EXCLUDED.is_active;