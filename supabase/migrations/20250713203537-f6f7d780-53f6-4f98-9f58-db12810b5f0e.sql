-- Agregar campo is_primary a la tabla NEW_Budget
ALTER TABLE public."NEW_Budget" 
ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Crear índice para mejorar rendimiento
CREATE INDEX idx_new_budget_is_primary_project ON public."NEW_Budget" (project_id, is_primary) 
WHERE is_primary = true;

-- Crear función para asegurar que solo un presupuesto sea primario por proyecto
CREATE OR REPLACE FUNCTION public.ensure_single_primary_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando como primario = true, desmarcar todos los otros del mismo proyecto
  IF NEW.is_primary = true THEN
    UPDATE public."NEW_Budget" 
    SET is_primary = false 
    WHERE project_id = NEW.project_id 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para ejecutar la función
CREATE TRIGGER trigger_ensure_single_primary_budget
  BEFORE INSERT OR UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_budget();