
-- Crear tipos enumerados básicos
CREATE TYPE project_status AS ENUM (
  'draft', 'confirmed', 'pre_production', 'in_production', 
  'quality_control', 'packaging', 'delivery', 'completed', 
  'cancelled', 'on_hold'
);

CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Tabla de clientes
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dni TEXT,
  address TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla principal de proyectos
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- Código de producción único
  model TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  status project_status DEFAULT 'draft',
  priority project_priority DEFAULT 'medium',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Fechas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  start_date TIMESTAMP WITH TIME ZONE,
  planned_end_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Especificaciones técnicas del vehículo
  power TEXT,
  interior_color TEXT,
  exterior_color TEXT,
  electric_system TEXT,
  extra_packages TEXT,
  
  -- Información financiera básica
  total_amount DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  pending_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- Notas
  notes TEXT
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_projects_code ON public.projects(code);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);

-- Habilitar Row Level Security (políticas permisivas por ahora)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Políticas temporales muy permisivas
CREATE POLICY "Enable all access for now" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for now" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular pending_amount automáticamente
CREATE OR REPLACE FUNCTION calculate_pending_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.pending_amount = NEW.total_amount - NEW.paid_amount;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_pending_amount_trigger BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION calculate_pending_amount();
