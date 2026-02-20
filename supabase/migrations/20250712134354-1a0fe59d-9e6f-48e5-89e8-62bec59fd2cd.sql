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

-- 3. Migrar datos desde phase_templates a NEW_Project_Phase_Template
INSERT INTO public."NEW_Project_Phase_Template" ("group", phase_order, phase_name, is_active, created_at, updated_at)
SELECT 
  phase_group as "group",
  order_index as phase_order,
  phase_name,
  COALESCE(is_required, true) as is_active,
  COALESCE(created_at, now()) as created_at,
  now() as updated_at
FROM public.phase_templates
WHERE NOT EXISTS (
  SELECT 1 FROM public."NEW_Project_Phase_Template" npt 
  WHERE npt."group" = phase_templates.phase_group 
  AND npt.phase_name = phase_templates.phase_name
);

-- 4. Migrar datos desde project_phase_progress a NEW_Project_Phase_Progress
-- Solo migrar para proyectos que existen en NEW_Projects
INSERT INTO public."NEW_Project_Phase_Progress" (project_id, phase_template_id, status, start_date, end_date, comments, created_at, updated_at)
SELECT 
  np.id as project_id,
  npt.id as phase_template_id,
  CASE 
    WHEN ppp.is_completed = true THEN 'completed'
    WHEN ppp.completed_at IS NOT NULL THEN 'in_progress'
    ELSE 'pending'
  END as status,
  ppp.completed_at::date as start_date,
  ppp.completed_at::date as end_date,
  ppp.notes as comments,
  COALESCE(ppp.created_at, now()) as created_at,
  COALESCE(ppp.updated_at, now()) as updated_at
FROM public.project_phase_progress ppp
JOIN public.phase_templates pt ON ppp.phase_template_id = pt.id
JOIN public."NEW_Project_Phase_Template" npt ON pt.phase_group = npt."group" AND pt.phase_name = npt.phase_name
JOIN public."NEW_Projects" np ON np.project_code = (
  SELECT code FROM public.projects p WHERE p.id = ppp.project_id
)
WHERE NOT EXISTS (
  SELECT 1 FROM public."NEW_Project_Phase_Progress" nppp 
  WHERE nppp.project_id = np.id 
  AND nppp.phase_template_id = npt.id
);

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE public."NEW_Project_Phase_Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NEW_Project_Phase_Progress" ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS
CREATE POLICY "Users can view project phase templates" ON public."NEW_Project_Phase_Template" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project phase templates" ON public."NEW_Project_Phase_Template" FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view project phase progress" ON public."NEW_Project_Phase_Progress" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage project phase progress" ON public."NEW_Project_Phase_Progress" FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. Crear triggers para updated_at
CREATE TRIGGER update_new_project_phase_template_updated_at
  BEFORE UPDATE ON public."NEW_Project_Phase_Template"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_new_project_phase_progress_updated_at
  BEFORE UPDATE ON public."NEW_Project_Phase_Progress"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Crear función para inicializar fases automáticamente para proyectos nuevos
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