
-- Crear enum para el estado de los códigos de proyecto
CREATE TYPE project_code_status AS ENUM ('available', 'assigned', 'completed', 'cancelled');

-- Crear tabla para gestionar códigos de proyecto
CREATE TABLE public.project_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  start_date DATE,
  end_date DATE,
  estimated_duration_days INTEGER,
  status project_code_status NOT NULL DEFAULT 'available',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_project_codes_status ON public.project_codes(status);
CREATE INDEX idx_project_codes_category ON public.project_codes(category);
CREATE INDEX idx_project_codes_dates ON public.project_codes(start_date, end_date);
CREATE INDEX idx_project_codes_project_id ON public.project_codes(project_id);

-- Añadir trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_project_codes_updated_at
  BEFORE UPDATE ON public.project_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.project_codes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para permitir acceso a usuarios autenticados
CREATE POLICY "Users can view all project codes" 
  ON public.project_codes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create project codes" 
  ON public.project_codes 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update project codes" 
  ON public.project_codes 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete project codes" 
  ON public.project_codes 
  FOR DELETE 
  USING (true);

-- Insertar algunos códigos de ejemplo
INSERT INTO public.project_codes (code, name, category, start_date, end_date, estimated_duration_days, notes) VALUES
('VEH-2024-001', 'Vehículo Deportivo Serie A', 'vehiculo', '2024-02-01', '2024-04-30', 90, 'Proyecto de vehículo deportivo de alta gama'),
('MOT-2024-001', 'Motocicleta Custom Premium', 'motocicleta', '2024-03-15', '2024-06-15', 90, 'Motocicleta personalizada para cliente VIP'),
('CUS-2024-001', 'Proyecto Personalizado Especial', 'custom', '2024-04-01', '2024-07-01', 90, 'Proyecto completamente personalizado');
