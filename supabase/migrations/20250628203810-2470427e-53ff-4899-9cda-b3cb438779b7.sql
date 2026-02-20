
-- Añadir campo para controlar si el estado se gestiona manualmente
ALTER TABLE projects ADD COLUMN manual_status_control boolean DEFAULT false;

-- Modificar la función de actualización automática para respetar el control manual
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
    manual_control BOOLEAN;
BEGIN
    -- Get project info including manual control flag
    SELECT * INTO project_record FROM projects WHERE id = NEW.project_id;
    
    -- Check if manual status control is enabled
    SELECT manual_status_control INTO manual_control 
    FROM projects 
    WHERE id = NEW.project_id;
    
    -- If manual control is enabled, don't auto-update status
    IF manual_control = true THEN
        RETURN NEW;
    END IF;
    
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
