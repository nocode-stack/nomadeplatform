-- LIMPIAR TODO y empezar bien

-- 1. Limpiar electric_systems de datos duplicados e incorrectos
DELETE FROM public."electric_systems";

-- 2. Limpiar NEW_Budget_Packs existentes
DELETE FROM public."NEW_Budget_Packs";

-- 3. Crear estructura correcta: TODO COMO PACKS

-- Pack Base (lo que va de serie)
INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Pack Base', 'Configuración base del vehículo', 0, true);

-- Packs principales de equipamiento
INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Neo Essential', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha', 1500, true),
('Neo Adventure', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha, Rueda de repuesto, Monocontrol, Sistema de gas GLP, Sistema de Litio, Mini extintor, Alarma gases, Toldo', 4000, true),
('Neo Ultimate', 'Cama interbanco, Ventana trasera extra, Ducha exterior, Mosquitera, Escalón eléctrico, Claraboya panorámica, Tarima antideslizante ducha, Rueda de repuesto, Monocontrol, Sistema de gas GLP, Sistema de Litio, Mini extintor, Alarma gases, Toldo, Pack cine: proyector + altavoces, Candados exteriores, Llantas', 5500, true);

-- Packs de sistemas eléctricos (COMO PACKS, no como electric_systems)
INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Sistema Litio', 'Batería de litio (100Ah), Placa solar monocristalina (200W), Inversor Multiplus 500W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 75/15. *Incluido en el paquete Adventure y Ultimate', 990, true),
('Sistema Litio+', 'Dos baterías de litio (200Ah), Placa solar monocristalina (200W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30. Al escoger el paquete Adventure o Ultimate: 1.210€', 2200, true),
('Sistema Pro', 'Dos baterías de litio (400Ah), Doble placa solar monocristalina (400W), Inversor Multiplus 2.000W Victron, Cargador de batería Orion XS 12/12-50A, SmartSolar MPPT 100/30. Al escoger el paquete Adventure o Ultimate: 1.810€', 2800, true);

-- Packs de extras
INSERT INTO public."NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Microondas', 'Microonda integrados con capacidad de 20L, revestimiento Ready2Clean y 6 niveles de funcionamiento', 200, true),
('Aire Acondicionado', 'Aire acondicionado Dometic FreshJet 2200 con control remoto, flujo ajustable y bomba de calor', 1500, true);