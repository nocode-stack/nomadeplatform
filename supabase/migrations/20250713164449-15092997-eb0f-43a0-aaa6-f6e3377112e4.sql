-- Limpiar NEW_Budget_Items existentes
DELETE FROM public."NEW_Budget_Items";

-- Crear todos los componentes individuales con códigos

-- COMPONENTES DEL PACK BASE (incluidos de serie)
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Cama fija trasera', 0, 1, 0, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Ducha interior', 0, 1, 0, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Calefacción estacionaria', 0, 1, 0, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Aislamiento térmico y acústico', 0, 1, 0, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Agua dulce 40L', 0, 1, 0, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Aguas grises 40L', 0, 1, 0, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

-- COMPONENTES NEO ESSENTIAL
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Cama interbanco', 247.93, 1, 247.93, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Ventana trasera extra', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Ducha exterior', 206.61, 1, 206.61, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Mosquitera', 82.64, 1, 82.64, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Escalón eléctrico', 495.87, 1, 495.87, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Claraboya panorámica', 206.61, 1, 206.61, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Tarima antideslizante ducha', 95.04, 1, 95.04, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

-- COMPONENTES NEO ADVENTURE (incluye todos los del Essential + estos adicionales)
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Cama interbanco', 247.93, 1, 247.93, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Ventana trasera extra', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Ducha exterior', 206.61, 1, 206.61, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Mosquitera', 82.64, 1, 82.64, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Escalón eléctrico', 495.87, 1, 495.87, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Claraboya panorámica', 206.61, 1, 206.61, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Tarima antideslizante ducha', 95.04, 1, 95.04, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

-- Componentes adicionales del Adventure
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Rueda de repuesto', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Monocontrol', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Sistema de gas GLP', 413.22, 1, 413.22, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Sistema de Litio', 818.18, 1, 818.18, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Mini extintor', 41.32, 1, 41.32, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Alarma gases', 123.97, 1, 123.97, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Toldo', 578.51, 1, 578.51, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

-- COMPONENTES NEO ULTIMATE (incluye todos los del Adventure + estos adicionales)
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Cama interbanco', 247.93, 1, 247.93, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Ventana trasera extra', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Ducha exterior', 206.61, 1, 206.61, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Mosquitera', 82.64, 1, 82.64, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Escalón eléctrico', 495.87, 1, 495.87, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Claraboya panorámica', 206.61, 1, 206.61, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Tarima antideslizante ducha', 95.04, 1, 95.04, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Rueda de repuesto', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Monocontrol', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Sistema de gas GLP', 413.22, 1, 413.22, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Sistema de Litio', 818.18, 1, 818.18, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Mini extintor', 41.32, 1, 41.32, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Alarma gases', 123.97, 1, 123.97, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Toldo', 578.51, 1, 578.51, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

-- Componentes adicionales del Ultimate
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Pack cine: proyector + altavoces', 826.45, 1, 826.45, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Candados exteriores', 123.97, 1, 123.97, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Llantas', 289.26, 1, 289.26, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

-- COMPONENTES DE SISTEMAS ELÉCTRICOS
-- Sistema Litio
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Batería de litio (100Ah)', 990, 1, 990, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Litio';

-- Sistema Litio+
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Dos baterías de litio (200Ah)', 1818.18, 1, 1818.18, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Litio+';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Inversor Multiplus 2.000W Victron', 381.82, 1, 381.82, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Litio+';

-- Sistema Pro
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Dos baterías de litio (400Ah)', 2314.05, 1, 2314.05, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Pro';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Doble placa solar monocristalina (400W)', 247.93, 1, 247.93, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Pro';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'SmartSolar MPPT 100/30', 238.02, 1, 238.02, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Pro';

-- COMPONENTES DE EXTRAS
-- Microondas
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Microonda integrados con capacidad de 20L', 165.29, 1, 165.29, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Microondas';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Revestimiento Ready2Clean', 20.66, 1, 20.66, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Microondas';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT '6 niveles de funcionamiento', 14.05, 1, 14.05, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Microondas';

-- Aire Acondicionado
INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Aire acondicionado Dometic FreshJet 2200', 1239.67, 1, 1239.67, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Control remoto', 123.97, 1, 123.97, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Flujo ajustable', 82.64, 1, 82.64, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';

INSERT INTO public."NEW_Budget_Items" (name, price, quantity, line_total, is_custom, is_discount, pack_id) 
SELECT 'Bomba de calor', 53.72, 1, 53.72, false, false, id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';