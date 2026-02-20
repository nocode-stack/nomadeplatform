
-- Fase 1: Crear las nuevas tablas para la estructura reorganizada

-- 1. Actualizar tabla de clientes con campos faltantes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS commercial_id UUID REFERENCES public.user_profiles(user_id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_company_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_company_cif TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS billing_address_line2 TEXT;

-- 2. Crear tabla de slots de producción
CREATE TABLE IF NOT EXISTS public.production_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_code TEXT NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  estimated_duration_days INTEGER DEFAULT 30,
  actual_duration_days INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'delayed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Crear tabla maestra de plantillas de fases
CREATE TABLE IF NOT EXISTS public.phase_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_group TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  description TEXT,
  estimated_days INTEGER DEFAULT 1,
  responsible_role TEXT,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Insertar las fases maestras según tu especificación
INSERT INTO public.phase_templates (phase_group, phase_name, order_index, responsible_role) VALUES
-- PROSPECT (estado inicial)
('prospect', 'Cliente potencial registrado', 1, 'commercial'),

-- PRE-PRODUCCIÓN
('pre_production', 'Pago y firma contrato de reserva', 2, 'commercial'),
('pre_production', 'Pago del 20% y firma acuerdo compraventa', 3, 'commercial'),
('pre_production', 'Pago del 60% y onboarding customer', 4, 'commercial'),

-- PRODUCCIÓN
('production', 'B1', 5, 'production'),
('production', 'B2', 6, 'production'),
('production', 'B3', 7, 'production'),
('production', 'B3.2', 8, 'production'),
('production', 'B4', 9, 'production'),
('production', 'B5', 10, 'production'),
('production', 'Control de calidad', 11, 'quality'),

-- REWORKS
('reworks', 'Reworks terminados', 12, 'production'),
('reworks', 'Homologación', 13, 'quality'),
('reworks', 'ITV', 14, 'quality'),

-- PRE ENTREGA
('pre_delivery', 'Pago del 20% final', 15, 'commercial'),
('pre_delivery', 'Pago del IEMDT', 16, 'commercial'),
('pre_delivery', 'Cambio de nombre', 17, 'commercial'),
('pre_delivery', 'Limpieza', 18, 'delivery'),

-- ENTREGA
('delivered', 'Entrega realizada', 19, 'delivery');

-- 5. Actualizar tabla de proyectos para vincular con slots de producción
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS production_slot_id UUID REFERENCES public.production_slots(id);

-- 6. Crear nueva tabla de fases de proyecto vinculada a plantillas
CREATE TABLE IF NOT EXISTS public.project_phase_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_template_id UUID NOT NULL REFERENCES public.phase_templates(id),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.user_profiles(user_id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, phase_template_id)
);

-- 7. Crear función para generar código de producción automático
CREATE OR REPLACE FUNCTION generate_production_code()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  production_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(production_code, 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM production_slots
  WHERE production_code LIKE 'N' || year_suffix || '%';
  
  -- Format: N + año(2 dígitos) + número secuencial(2 dígitos)
  production_code := 'N' || year_suffix || LPAD(next_number::TEXT, 2, '0');
  
  RETURN production_code;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear función para inicializar fases de proyecto
CREATE OR REPLACE FUNCTION initialize_project_phases(project_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Insertar todas las fases plantilla para el proyecto
  INSERT INTO project_phase_progress (project_id, phase_template_id)
  SELECT project_id_param, id
  FROM phase_templates
  ORDER BY order_index;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear función para calcular estado del proyecto basado en fases completadas
CREATE OR REPLACE FUNCTION calculate_project_status(project_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  completed_phases TEXT[];
  project_status TEXT;
BEGIN
  -- Obtener grupos de fases completadas
  SELECT ARRAY_AGG(DISTINCT pt.phase_group)
  INTO completed_phases
  FROM project_phase_progress ppp
  JOIN phase_templates pt ON ppp.phase_template_id = pt.id
  WHERE ppp.project_id = project_id_param AND ppp.is_completed = true;
  
  -- Determinar estado basado en fases completadas
  IF 'delivered' = ANY(completed_phases) THEN
    project_status := 'delivered';
  ELSIF 'pre_delivery' = ANY(completed_phases) THEN
    project_status := 'pre_delivery';
  ELSIF 'reworks' = ANY(completed_phases) THEN
    project_status := 'reworks';
  ELSIF 'production' = ANY(completed_phases) THEN
    project_status := 'production';
  ELSIF 'pre_production' = ANY(completed_phases) THEN
    project_status := 'pre_production';
  ELSE
    project_status := 'prospect';
  END IF;
  
  -- Actualizar el estado del proyecto
  UPDATE projects 
  SET status = project_status::project_status,
      updated_at = now()
  WHERE id = project_id_param;
  
  RETURN project_status;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear trigger para actualizar estado automáticamente
CREATE OR REPLACE FUNCTION update_project_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_project_status(NEW.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_update_project_status ON project_phase_progress;
CREATE TRIGGER trigger_update_project_status
  AFTER INSERT OR UPDATE OF is_completed ON project_phase_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_project_status_trigger();

-- 11. Habilitar RLS en las nuevas tablas
ALTER TABLE public.production_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phase_progress ENABLE ROW LEVEL SECURITY;

-- 12. Crear políticas RLS básicas (permitir todo por ahora para desarrollo)
CREATE POLICY "Allow all operations on production_slots" ON public.production_slots FOR ALL USING (true);
CREATE POLICY "Allow all operations on phase_templates" ON public.phase_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on project_phase_progress" ON public.project_phase_progress FOR ALL USING (true);

-- 13. Crear triggers para updated_at
CREATE TRIGGER update_production_slots_updated_at
  BEFORE UPDATE ON public.production_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phase_progress_updated_at
  BEFORE UPDATE ON public.project_phase_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
