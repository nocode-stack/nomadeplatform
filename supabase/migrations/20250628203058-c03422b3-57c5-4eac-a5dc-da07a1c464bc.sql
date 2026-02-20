
-- Añadir 'reworks' al enum de project_status
ALTER TYPE project_status ADD VALUE 'reworks';

-- Actualizar la función que determina el estado basado en las fases
CREATE OR REPLACE FUNCTION public.update_project_status_based_on_phases()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    project_record RECORD;
    pre_production_completed BOOLEAN;
    production_completed BOOLEAN;
    reworks_completed BOOLEAN;
    pre_delivery_completed BOOLEAN;
    delivery_completed BOOLEAN;
    all_completed BOOLEAN;
BEGIN
    -- Get project info
    SELECT * INTO project_record FROM projects WHERE id = NEW.project_id;
    
    -- Check completion status of each phase group
    SELECT 
        COUNT(*) = COUNT(CASE WHEN is_completed THEN 1 END) INTO pre_production_completed
    FROM project_phases 
    WHERE project_id = NEW.project_id AND phase_group = 'pre_produccion';
    
    SELECT 
        COUNT(*) = COUNT(CASE WHEN is_completed THEN 1 END) INTO production_completed
    FROM project_phases 
    WHERE project_id = NEW.project_id AND phase_group = 'produccion';
    
    SELECT 
        COUNT(*) = COUNT(CASE WHEN is_completed THEN 1 END) INTO reworks_completed
    FROM project_phases 
    WHERE project_id = NEW.project_id AND phase_group = 'reworks';
    
    SELECT 
        COUNT(*) = COUNT(CASE WHEN is_completed THEN 1 END) INTO pre_delivery_completed
    FROM project_phases 
    WHERE project_id = NEW.project_id AND phase_group = 'pre_entrega';
    
    SELECT 
        COUNT(*) = COUNT(CASE WHEN is_completed THEN 1 END) INTO delivery_completed
    FROM project_phases 
    WHERE project_id = NEW.project_id AND phase_group = 'entrega';
    
    -- Check if all phases are completed
    SELECT 
        COUNT(*) = COUNT(CASE WHEN is_completed THEN 1 END) INTO all_completed
    FROM project_phases 
    WHERE project_id = NEW.project_id;
    
    -- Update project status based on phase completion
    UPDATE projects 
    SET status = CASE
        WHEN all_completed THEN 'completed'::project_status
        WHEN delivery_completed THEN 'delivery'::project_status
        WHEN pre_delivery_completed THEN 'packaging'::project_status
        WHEN reworks_completed THEN 'reworks'::project_status
        WHEN production_completed THEN 'in_production'::project_status
        WHEN pre_production_completed THEN 'pre_production'::project_status
        WHEN EXISTS (SELECT 1 FROM project_phases WHERE project_id = NEW.project_id AND is_completed = true) THEN 'pre_production'::project_status
        ELSE 'draft'::project_status
    END,
    updated_at = now()
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$function$;

-- Actualizar la función create_default_project_phases para incluir las fases de reworks
CREATE OR REPLACE FUNCTION public.create_default_project_phases(project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO project_phases (project_id, phase_name, phase_group, order_index, responsible_role) VALUES
  -- PRE PRODUCCIÓN
  (project_id, 'Pago 500 € y firma contrato de reserva', 'pre_produccion', 1, 'commercial'),
  (project_id, 'Pago 60% y cierre de proyecto definitivo', 'pre_produccion', 2, 'commercial'),
  (project_id, 'Pago 20% y firma acuerdo de compraventa', 'pre_produccion', 3, 'commercial'),
  (project_id, 'Onboarding Customer', 'pre_produccion', 4, 'commercial'),
  
  -- FASE PRODUCCIÓN
  (project_id, 'B1', 'produccion', 5, 'production'),
  (project_id, 'B2', 'produccion', 6, 'production'),
  (project_id, 'B3', 'produccion', 7, 'production'),
  (project_id, 'B3.2', 'produccion', 8, 'production'),
  (project_id, 'B4', 'produccion', 9, 'production'),
  (project_id, 'B5', 'produccion', 10, 'production'),
  (project_id, 'Control de calidad', 'produccion', 11, 'quality'),
  (project_id, 'Homologación completa', 'produccion', 12, 'quality'),
  
  -- FASE REWORKS
  (project_id, 'Revisión de incidencias', 'reworks', 13, 'quality'),
  (project_id, 'Corrección de defectos', 'reworks', 14, 'production'),
  (project_id, 'Validación final', 'reworks', 15, 'quality'),
  
  -- FASE PREENTREGA
  (project_id, 'Pago del 20% final', 'pre_entrega', 16, 'commercial'),
  (project_id, 'Pago IEMDT', 'pre_entrega', 17, 'commercial'),
  (project_id, 'Cambio de nombre', 'pre_entrega', 18, 'commercial'),
  
  -- FASE ENTREGA
  (project_id, 'Fecha de entrega', 'entrega', 19, 'delivery'),
  (project_id, 'Limpieza y cierre vehículo', 'entrega', 20, 'delivery'),
  (project_id, 'Entrega realizada', 'entrega', 21, 'delivery'),
  
  -- FASE ENTREGADO
  (project_id, 'Envío documentación oficial', 'entregado', 22, 'delivery');
END;
$function$;
