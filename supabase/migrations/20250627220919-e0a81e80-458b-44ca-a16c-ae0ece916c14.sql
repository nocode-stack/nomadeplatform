
-- Primero, vamos a ver qué valores de estado están permitidos actualmente
-- y actualizar la restricción para incluir todos los estados necesarios
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_status_check;

-- Crear la nueva restricción con todos los estados válidos
ALTER TABLE public.incidents ADD CONSTRAINT incidents_status_check 
CHECK (status IN ('reportada', 'fechas_asignadas', 'en_reparacion', 'terminada'));

-- También vamos a verificar que la columna workshop tenga los valores correctos
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_workshop_check;

ALTER TABLE public.incidents ADD CONSTRAINT incidents_workshop_check 
CHECK (workshop IN ('Nomade', 'Caravaning Plaza', 'Planeta Camper', 'Al Milimetro'));

-- Y la columna category
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_category_check;

ALTER TABLE public.incidents ADD CONSTRAINT incidents_category_check 
CHECK (category IN ('Mobiliario', 'Sistema eléctrico', 'Agua', 'Gas', 'Revestimiento', 'Vehículo', 'Filtraciones'));
