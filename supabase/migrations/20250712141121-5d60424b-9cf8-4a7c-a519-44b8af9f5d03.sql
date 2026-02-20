-- Verificar y recrear el trigger para inicializar fases automáticamente
-- Primero, eliminar el trigger existente si existe
DROP TRIGGER IF EXISTS auto_initialize_new_project_phases_trigger ON "NEW_Projects";

-- Actualizar la función para asegurar que la primera fase se marca como completada
CREATE OR REPLACE FUNCTION public.auto_initialize_new_project_phases()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Llamar a la función que inicializa las fases
  PERFORM initialize_new_project_phases(NEW.id);
  RETURN NEW;
END;
$function$;

-- Actualizar la función de inicialización para marcar prospect como completado
CREATE OR REPLACE FUNCTION public.initialize_new_project_phases(project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  first_phase_id uuid;
BEGIN
  -- Insertar todas las fases activas del template para el nuevo proyecto
  INSERT INTO public."NEW_Project_Phase_Progress" (project_id, phase_template_id, status, start_date, end_date)
  SELECT 
    project_id_param, 
    id,
    CASE 
      -- Marcar como completada la primera fase (la de menor order)
      WHEN phase_order = (SELECT MIN(phase_order) FROM public."NEW_Project_Phase_Template" WHERE is_active = true) THEN 'completed'
      ELSE 'pending'
    END,
    CASE 
      -- Establecer fecha de inicio para la primera fase
      WHEN phase_order = (SELECT MIN(phase_order) FROM public."NEW_Project_Phase_Template" WHERE is_active = true) THEN CURRENT_DATE
      ELSE null
    END,
    CASE 
      -- Establecer fecha de fin para la primera fase (completada)
      WHEN phase_order = (SELECT MIN(phase_order) FROM public."NEW_Project_Phase_Template" WHERE is_active = true) THEN CURRENT_DATE
      ELSE null
    END
  FROM public."NEW_Project_Phase_Template"
  WHERE is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public."NEW_Project_Phase_Progress" nppp 
    WHERE nppp.project_id = project_id_param 
    AND nppp.phase_template_id = "NEW_Project_Phase_Template".id
  )
  ORDER BY phase_order;
  
  -- Log para debugging
  RAISE NOTICE 'Fases inicializadas para proyecto: %', project_id_param;
END;
$function$;

-- Crear el trigger que se ejecuta después de insertar un proyecto
CREATE TRIGGER auto_initialize_new_project_phases_trigger
  AFTER INSERT ON public."NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_initialize_new_project_phases();

-- Verificar que tenemos templates de fases activas
DO $$
DECLARE
  template_count integer;
BEGIN
  SELECT COUNT(*) INTO template_count 
  FROM public."NEW_Project_Phase_Template" 
  WHERE is_active = true;
  
  IF template_count = 0 THEN
    -- Insertar algunas fases básicas si no existen
    INSERT INTO public."NEW_Project_Phase_Template" (phase_name, "group", phase_order, is_active) VALUES
    ('Cliente potencial registrado', 'prospect', 1, true),
    ('Presupuesto enviado', 'prospect', 2, true),
    ('Contrato firmado', 'pre_production', 3, true),
    ('Vehículo adquirido', 'pre_production', 4, true),
    ('Inicio de producción', 'production', 5, true),
    ('Producción completada', 'production', 6, true),
    ('Control de calidad', 'pre_delivery', 7, true),
    ('Entrega al cliente', 'delivered', 8, true);
    
    RAISE NOTICE 'Templates de fases creados: %', template_count;
  ELSE
    RAISE NOTICE 'Templates de fases existentes: %', template_count;
  END IF;
END $$;