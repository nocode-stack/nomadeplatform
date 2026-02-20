-- Crear tabla NEW_Production_Settings
CREATE TABLE public.NEW_Production_Settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  default_slot_duration INTEGER NOT NULL,
  days_between_slots INTEGER NOT NULL,
  applies_from_slot_id UUID REFERENCES public.project_codes(id),
  last_updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla NEW_Production_Schedule
CREATE TABLE public.NEW_Production_Schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_code TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.NEW_Production_Settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.NEW_Production_Schedule ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para NEW_Production_Settings
CREATE POLICY "Users can view production settings" 
ON public.NEW_Production_Settings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create production settings" 
ON public.NEW_Production_Settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update production settings" 
ON public.NEW_Production_Settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete production settings" 
ON public.NEW_Production_Settings 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Políticas RLS para NEW_Production_Schedule
CREATE POLICY "Users can view production schedule" 
ON public.NEW_Production_Schedule 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create production schedule" 
ON public.NEW_Production_Schedule 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update production schedule" 
ON public.NEW_Production_Schedule 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete production schedule" 
ON public.NEW_Production_Schedule 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_production_settings_updated_at
  BEFORE UPDATE ON public.NEW_Production_Settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_production_schedule_updated_at
  BEFORE UPDATE ON public.NEW_Production_Schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_production_settings_active ON public.NEW_Production_Settings(is_active);
CREATE INDEX idx_production_schedule_project_id ON public.NEW_Production_Schedule(project_id);
CREATE INDEX idx_production_schedule_dates ON public.NEW_Production_Schedule(start_date, end_date);