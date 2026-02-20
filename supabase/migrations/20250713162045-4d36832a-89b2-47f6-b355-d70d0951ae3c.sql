-- Limpiar datos existentes para evitar duplicados
DELETE FROM public."NEW_Budget_Packs" WHERE name IN ('Neo Essential', 'Neo Adventure', 'Neo Ultimate');

-- Crear los 3 packs principales
INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Neo Essential', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha', 1500, true),
('Neo Adventure', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha, Rueda de repuesto, Monocontrol, Sistema de gas GLP, Sistema de Litio, Mini extintor, Alarma gases, Toldo', 4000, true),
('Neo Ultimate', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha, Rueda de repuesto, Monocontrol, Sistema de gas GLP, Sistema de Litio, Mini extintor, Alarma gases, Toldo, Pack cine: proyector + altavoces, Candados exteriores, Llantas', 5500, true);

-- Limpiar sistemas eléctricos existentes problemáticos
DELETE FROM public."electric_systems" WHERE name IN ('Sistema Litio', 'Sistema Litio+', 'Sistema Pro');

-- Crear sistemas eléctricos correctos
INSERT INTO public."electric_systems" (name, description, price, discount_price, order_index, is_standalone, is_active) VALUES
('Sistema Litio', 'Batería de litio (100Ah), Placa solar monocristalina (200W), Inversor Multiplus 500W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 75/15', 990, 0, 1, false, true),
('Sistema Litio+', 'Dos baterías de litio (200Ah), Placa solar monocristalina (200W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30', 2200, 1210, 2, true, true),
('Sistema Pro', 'Dos baterías de litio (400Ah), Doble placa solar monocristalina (400W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30', 2800, 1810, 3, true, true);

-- Limpiar extras existentes
DELETE FROM public."extra_components" WHERE name IN ('Microondas integrados', 'Aire acondicionado Dometic FreshJet 2200');

-- Crear los extras adicionales
INSERT INTO public."extra_components" (name, description, price, category, is_active) VALUES
('Microondas integrados', 'Microonda integrados con capacidad de 20L, revestimiento Ready2Clean y 6 niveles de funcionamiento', 200, 'Electrodomésticos', true),
('Aire acondicionado Dometic FreshJet 2200', 'Aire acondicionado Dometic FreshJet 2200 con control remoto, flujo ajustable y bomba de calor', 1500, 'Climatización', true);