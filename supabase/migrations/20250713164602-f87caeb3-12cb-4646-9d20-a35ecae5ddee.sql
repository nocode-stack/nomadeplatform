-- Primero necesito modificar la estructura para que los items no requieran budget_id
-- Crear una tabla temporal para los conceptos/items disponibles
CREATE TABLE IF NOT EXISTS public."NEW_Budget_Concepts_Available" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  pack_id UUID REFERENCES public."NEW_Budget_Packs"(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Limpiar tabla de conceptos disponibles si existe
DELETE FROM public."NEW_Budget_Concepts_Available";

-- CONCEPTOS DEL PACK BASE (incluidos de serie)
INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Cama fija trasera', 0, 'base', id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Ducha interior', 0, 'base', id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Calefacción estacionaria', 0, 'base', id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Aislamiento térmico y acústico', 0, 'base', id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Agua dulce 40L', 0, 'base', id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Aguas grises 40L', 0, 'base', id FROM public."NEW_Budget_Packs" WHERE name = 'Pack Base';

-- CONCEPTOS NEO ESSENTIAL
INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Cama interbanco', 247.93, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Ventana trasera extra', 165.29, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Ducha exterior', 206.61, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Mosquitera', 82.64, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Escalón eléctrico', 495.87, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Claraboya panorámica', 206.61, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Tarima antideslizante ducha', 95.04, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Essential';

-- CONCEPTOS ADICIONALES NEO ADVENTURE
INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Rueda de repuesto', 165.29, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Monocontrol', 165.29, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Sistema de gas GLP', 413.22, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Sistema de Litio básico incluido', 818.18, 'electrico', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Mini extintor', 41.32, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Alarma gases', 123.97, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Toldo', 578.51, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Adventure';

-- CONCEPTOS ADICIONALES NEO ULTIMATE
INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Pack cine: proyector + altavoces', 826.45, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Candados exteriores', 123.97, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Llantas', 289.26, 'equipamiento', id FROM public."NEW_Budget_Packs" WHERE name = 'Neo Ultimate';

-- CONCEPTOS DE SISTEMAS ELÉCTRICOS INDEPENDIENTES
INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Batería de litio (100Ah)', 990, 'electrico', id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Litio';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Dos baterías de litio (200Ah)', 1818.18, 'electrico', id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Litio+';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Inversor Multiplus 2.000W Victron', 381.82, 'electrico', id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Litio+';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Dos baterías de litio (400Ah)', 2314.05, 'electrico', id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Pro';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Doble placa solar monocristalina (400W)', 247.93, 'electrico', id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Pro';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'SmartSolar MPPT 100/30', 238.02, 'electrico', id FROM public."NEW_Budget_Packs" WHERE name = 'Sistema Pro';

-- CONCEPTOS DE EXTRAS
INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Microonda integrados con capacidad de 20L', 165.29, 'extra', id FROM public."NEW_Budget_Packs" WHERE name = 'Microondas';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Revestimiento Ready2Clean', 20.66, 'extra', id FROM public."NEW_Budget_Packs" WHERE name = 'Microondas';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT '6 niveles de funcionamiento', 14.05, 'extra', id FROM public."NEW_Budget_Packs" WHERE name = 'Microondas';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Aire acondicionado Dometic FreshJet 2200', 1239.67, 'extra', id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Control remoto', 123.97, 'extra', id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Flujo ajustable', 82.64, 'extra', id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';

INSERT INTO public."NEW_Budget_Concepts_Available" (name, price, category, pack_id) 
SELECT 'Bomba de calor', 53.72, 'extra', id FROM public."NEW_Budget_Packs" WHERE name = 'Aire Acondicionado';