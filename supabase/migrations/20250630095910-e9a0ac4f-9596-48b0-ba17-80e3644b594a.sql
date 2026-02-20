
-- Crear tabla de vehículos
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_bastidor TEXT NOT NULL UNIQUE,
  matricula TEXT NULL,
  color_exterior TEXT NOT NULL,
  motorizacion TEXT NOT NULL CHECK (motorizacion IN ('140cv manual', '180cv automatica')),
  plazas INTEGER NOT NULL CHECK (plazas IN (2, 3)),
  proveedor TEXT NOT NULL,
  project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Añadir índices para mejor rendimiento
CREATE INDEX idx_vehicles_project_id ON public.vehicles(project_id);
CREATE INDEX idx_vehicles_numero_bastidor ON public.vehicles(numero_bastidor);
CREATE INDEX idx_vehicles_matricula ON public.vehicles(matricula);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para permitir acceso a todos los usuarios autenticados
CREATE POLICY "Users can view all vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create vehicles" 
  ON public.vehicles 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update vehicles" 
  ON public.vehicles 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete vehicles" 
  ON public.vehicles 
  FOR DELETE 
  USING (true);
