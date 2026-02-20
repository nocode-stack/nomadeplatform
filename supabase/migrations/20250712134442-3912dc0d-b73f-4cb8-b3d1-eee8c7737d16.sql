-- Crear las nuevas tablas de fases de proyecto para trabajar con NEW_Projects

-- 1. Crear tabla de plantillas de fases (NEW_Project_Phase_Template)
CREATE TABLE IF NOT EXISTS public."NEW_Project_Phase_Template" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "group" TEXT NOT NULL,
  phase_order INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Crear tabla de progreso de fases (NEW_Project_Phase_Progress)  
CREATE TABLE IF NOT EXISTS public."NEW_Project_Phase_Progress" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public."NEW_Projects"(id) ON DELETE CASCADE,
  phase_template_id UUID NOT NULL REFERENCES public."NEW_Project_Phase_Template"(id),
  status TEXT NOT NULL DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, phase_template_id)
);

-- 3. Insertar plantillas de fases básicas
INSERT INTO public."NEW_Project_Phase_Template" ("group", phase_order, phase_name, is_active)
VALUES
  ('prospect', 1, 'Cliente potencial registrado', true),
  ('pre_production', 2, 'Pago y firma contrato de reserva', true),
  ('pre_production', 3, 'Pago del 20% y firma acuerdo compraventa', true),
  ('pre_production', 4, 'Pago del 60% y onboarding customer', true),
  ('production', 5, 'B1', true),
  ('production', 6, 'B2', true),
  ('production', 7, 'B3', true),
  ('production', 8, 'B3.2', true),
  ('production', 9, 'B4', true),
  ('production', 10, 'B5', true),
  ('production', 11, 'Control de calidad', true),
  ('reworks', 12, 'Reworks terminados', true),
  ('reworks', 13, 'Homologación', true),
  ('reworks', 14, 'ITV', true),
  ('pre_delivery', 15, 'Pago del 20% final', true),
  ('pre_delivery', 16, 'Pago del IEMDT', true),
  ('pre_delivery', 17, 'Cambio de nombre', true),
  ('pre_delivery', 18, 'Limpieza', true),
  ('delivered', 19, 'Entrega realizada', true)
ON CONFLICT DO NOTHING;

-- 4. Habilitar RLS en las nuevas tablas
ALTER TABLE public."NEW_Project_Phase_Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NEW_Project_Phase_Progress" ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS
CREATE POLICY "Users can view project phase templates" ON public."NEW_Project_Phase_Template" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project phase templates" ON public."NEW_Project_Phase_Template" FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view project phase progress" ON public."NEW_Project_Phase_Progress" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project phase progress" ON public."NEW_Project_Phase_Progress" FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Crear triggers para updated_at
CREATE TRIGGER update_new_project_phase_template_updated_at
  BEFORE UPDATE ON public."NEW_Project_Phase_Template"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_new_project_phase_progress_updated_at
  BEFORE UPDATE ON public."NEW_Project_Phase_Progress"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Crear función para inicializar fases automáticamente para proyectos nuevos
CREATE OR REPLACE FUNCTION public.initialize_new_project_phases(project_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Insertar todas las fases activas del template para el nuevo proyecto
  INSERT INTO public."NEW_Project_Phase_Progress" (project_id, phase_template_id, status)
  SELECT 
    project_id_param, 
    id,
    'pending'
  FROM public."NEW_Project_Phase_Template"
  WHERE is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public."NEW_Project_Phase_Progress" nppp 
    WHERE nppp.project_id = project_id_param 
    AND nppp.phase_template_id = "NEW_Project_Phase_Template".id
  )
  ORDER BY phase_order;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger para inicializar fases automáticamente al crear un proyecto
CREATE OR REPLACE FUNCTION public.auto_initialize_new_project_phases()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_new_project_phases(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_initialize_new_project_phases
  AFTER INSERT ON public."NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_new_project_phases();