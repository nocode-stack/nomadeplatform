
-- Asegurar que el trigger para actualizar el estado del proyecto esté activo
DROP TRIGGER IF EXISTS update_project_status_on_phase_change ON project_phase_progress;
CREATE TRIGGER update_project_status_on_phase_change
  AFTER INSERT OR UPDATE OR DELETE ON project_phase_progress
  FOR EACH ROW EXECUTE FUNCTION update_project_status_trigger();

-- Crear trigger para inicializar fases automáticamente cuando se crea un proyecto
CREATE OR REPLACE FUNCTION initialize_project_phases_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Inicializar las fases del proyecto automáticamente
  PERFORM initialize_project_phases(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a la tabla projects
DROP TRIGGER IF EXISTS auto_initialize_phases ON projects;
CREATE TRIGGER auto_initialize_phases
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION initialize_project_phases_trigger();

-- Inicializar las fases para proyectos existentes que no las tengan
INSERT INTO project_phase_progress (project_id, phase_template_id)
SELECT p.id, pt.id
FROM projects p
CROSS JOIN phase_templates pt
WHERE NOT EXISTS (
  SELECT 1 FROM project_phase_progress ppp 
  WHERE ppp.project_id = p.id AND ppp.phase_template_id = pt.id
)
ORDER BY pt.order_index;

-- Recalcular el estado de todos los proyectos
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id FROM projects LOOP
    PERFORM calculate_project_status(project_record.id);
  END LOOP;
END $$;
