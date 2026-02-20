
-- Crear tabla para historial de fechas de entrega
CREATE TABLE public.delivery_date_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  old_delivery_date DATE,
  new_delivery_date DATE NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para mejorar consultas por proyecto
CREATE INDEX idx_delivery_date_history_project_id ON public.delivery_date_history(project_id);
CREATE INDEX idx_delivery_date_history_created_at ON public.delivery_date_history(project_id, created_at);

-- Habilitar RLS
ALTER TABLE public.delivery_date_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Users can view delivery date history" 
  ON public.delivery_date_history 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Política para permitir inserción a usuarios autenticados
CREATE POLICY "Users can insert delivery date history" 
  ON public.delivery_date_history 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Función para registrar cambios automáticamente cuando se actualiza production_schedule
CREATE OR REPLACE FUNCTION public.track_delivery_date_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo registrar si la fecha de entrega cambió
  IF OLD.delivery_date IS DISTINCT FROM NEW.delivery_date THEN
    INSERT INTO public.delivery_date_history (
      project_id,
      old_delivery_date,
      new_delivery_date,
      change_reason,
      changed_by
    ) VALUES (
      NEW.project_id,
      OLD.delivery_date,
      NEW.delivery_date,
      'Updated via production schedule',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para rastrear cambios en production_schedule
CREATE TRIGGER track_delivery_date_changes_trigger
  AFTER UPDATE ON public.production_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.track_delivery_date_changes();

-- Insertar registros iniciales para proyectos existentes que tengan fechas de entrega
INSERT INTO public.delivery_date_history (project_id, old_delivery_date, new_delivery_date, change_reason)
SELECT 
  ps.project_id,
  NULL as old_delivery_date,
  ps.delivery_date,
  'Initial delivery date set'
FROM public.production_schedule ps
WHERE ps.delivery_date IS NOT NULL
  AND ps.project_id IS NOT NULL
ON CONFLICT DO NOTHING;
