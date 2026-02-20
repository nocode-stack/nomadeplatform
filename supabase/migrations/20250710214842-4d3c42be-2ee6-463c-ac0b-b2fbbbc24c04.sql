-- Crear tabla NEW_Vehicles
CREATE TABLE public."NEW_Vehicles" (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_code text NOT NULL,
  numero_bastidor text NOT NULL,
  matricula text,
  vehicle_option_id uuid NOT NULL,
  project_id uuid,
  proveedor text,
  estado_pago text DEFAULT 'pendiente',
  fecha_pago date,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_new_vehicles_vehicle_code ON public."NEW_Vehicles"(vehicle_code);
CREATE INDEX idx_new_vehicles_numero_bastidor ON public."NEW_Vehicles"(numero_bastidor);
CREATE INDEX idx_new_vehicles_project_id ON public."NEW_Vehicles"(project_id);
CREATE INDEX idx_new_vehicles_vehicle_option_id ON public."NEW_Vehicles"(vehicle_option_id);

-- Agregar foreign keys
ALTER TABLE public."NEW_Vehicles" 
ADD CONSTRAINT "NEW_Vehicles_vehicle_option_id_fkey" 
FOREIGN KEY (vehicle_option_id) 
REFERENCES public.vehicle_options(id);

ALTER TABLE public."NEW_Vehicles" 
ADD CONSTRAINT "NEW_Vehicles_project_id_fkey" 
FOREIGN KEY (project_id) 
REFERENCES public."NEW_Projects"(id) 
ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public."NEW_Vehicles" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view all vehicles" ON public."NEW_Vehicles"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create vehicles" ON public."NEW_Vehicles"
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vehicles" ON public."NEW_Vehicles"
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vehicles" ON public."NEW_Vehicles"
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Función para generar código de vehículo
CREATE OR REPLACE FUNCTION public.generate_vehicle_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  result_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(vehicle_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM "NEW_Vehicles"
  WHERE vehicle_code LIKE 'VH_' || year_suffix || '%';
  
  -- Format: VH_año(2 dígitos)_número secuencial(3 dígitos con ceros)
  result_code := 'VH_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result_code;
END;
$$;

-- Trigger para asignar código automáticamente
CREATE OR REPLACE FUNCTION public.set_vehicle_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.vehicle_code IS NULL OR NEW.vehicle_code = '' THEN
    NEW.vehicle_code := generate_vehicle_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_vehicle_code_trigger
  BEFORE INSERT ON public."NEW_Vehicles"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vehicle_code();

-- Trigger para actualizar updated_at
CREATE TRIGGER update_new_vehicles_updated_at
  BEFORE UPDATE ON public."NEW_Vehicles"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();