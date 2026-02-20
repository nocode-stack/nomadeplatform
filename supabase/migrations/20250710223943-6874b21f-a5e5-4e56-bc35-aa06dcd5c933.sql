-- Crear tabla NEW_Vehicles_Settings para reemplazar vehicle_options con más información detallada
CREATE TABLE public."NEW_Vehicles_Settings" (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    engine TEXT NOT NULL, -- Motorización (ej. 120cv, 140cv, 180cv)
    transmission TEXT NOT NULL, -- Tipo de cambio (Manual o Automática)
    color TEXT NOT NULL, -- Color exterior
    dimensions TEXT NOT NULL, -- Ej. L3H2, L2H2
    price NUMERIC DEFAULT 0, -- Mantener precio para compatibilidad
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public."NEW_Vehicles_Settings" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Anyone can view vehicle settings" 
ON public."NEW_Vehicles_Settings" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage vehicle settings" 
ON public."NEW_Vehicles_Settings" 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Crear trigger para updated_at
CREATE TRIGGER update_new_vehicles_settings_updated_at
    BEFORE UPDATE ON public."NEW_Vehicles_Settings"
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejor rendimiento
CREATE INDEX idx_new_vehicles_settings_name ON public."NEW_Vehicles_Settings"(name);
CREATE INDEX idx_new_vehicles_settings_engine ON public."NEW_Vehicles_Settings"(engine);
CREATE INDEX idx_new_vehicles_settings_transmission ON public."NEW_Vehicles_Settings"(transmission);
CREATE INDEX idx_new_vehicles_settings_is_active ON public."NEW_Vehicles_Settings"(is_active);

-- Insertar configuraciones iniciales basadas en vehicle_options existentes
INSERT INTO public."NEW_Vehicles_Settings" (name, engine, transmission, color, dimensions, price, is_active, order_index)
SELECT 
    vo.name,
    vo.power as engine,
    vo.transmission,
    'Gris' as color, -- Color por defecto
    'L2H2' as dimensions, -- Dimensiones por defecto
    vo.price,
    vo.is_active,
    ROW_NUMBER() OVER (ORDER BY vo.name) - 1 as order_index
FROM public.vehicle_options vo
WHERE vo.is_active = true;

-- Actualizar la tabla NEW_Vehicles para usar vehicle_settings_id en lugar de vehicle_option_id
ALTER TABLE public."NEW_Vehicles" 
ADD COLUMN vehicle_settings_id UUID REFERENCES public."NEW_Vehicles_Settings"(id);

-- Migrar datos existentes de vehicle_option_id a vehicle_settings_id
UPDATE public."NEW_Vehicles" nv
SET vehicle_settings_id = nvs.id
FROM public."NEW_Vehicles_Settings" nvs
JOIN public.vehicle_options vo ON vo.name = nvs.name AND vo.power = nvs.engine AND vo.transmission = nvs.transmission
WHERE nv.vehicle_option_id = vo.id;