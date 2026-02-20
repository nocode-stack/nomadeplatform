-- Crear función para sincronizar información del proyecto con presupuesto primario
CREATE OR REPLACE FUNCTION public.sync_project_info_from_primary_budget()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  budget_info RECORD;
  model_name TEXT;
  engine_name TEXT;
  color_name TEXT;
  client_info RECORD;
BEGIN
  -- Solo proceder si se marca como primario
  IF NEW.is_primary = true THEN
    
    -- Obtener información completa del presupuesto
    SELECT 
      b.*,
      mo.name as model_option_name,
      eo.name as engine_option_name,
      eo.power as engine_power,
      eo.transmission as engine_transmission,
      eco.name as exterior_color_name,
      c.name as client_name,
      c.email as client_email,
      c.phone as client_phone
    INTO budget_info
    FROM public."NEW_Budget" b
    LEFT JOIN public.model_options mo ON b.model_option_id = mo.id
    LEFT JOIN public.engine_options eo ON b.engine_option_id = eo.id
    LEFT JOIN public.exterior_color_options eco ON b.exterior_color_id = eco.id
    LEFT JOIN public."NEW_Projects" p ON b.project_id = p.id
    LEFT JOIN public."NEW_Clients" c ON p.client_id = c.id
    WHERE b.id = NEW.id;
    
    -- Construir nombre del modelo completo
    model_name := COALESCE(budget_info.model_option_name, 'Modelo no especificado');
    
    -- Construir nombre del motor completo
    engine_name := CONCAT_WS(' ', 
      COALESCE(budget_info.engine_option_name, ''),
      COALESCE(budget_info.engine_power, ''),
      COALESCE(budget_info.engine_transmission, '')
    );
    
    -- Nombre del color
    color_name := COALESCE(budget_info.exterior_color_name, 'Color no especificado');
    
    -- Actualizar el proyecto con la información del presupuesto primario
    UPDATE public."NEW_Projects"
    SET 
      client_name = COALESCE(budget_info.client_name, client_name),
      updated_at = now()
    WHERE id = NEW.project_id;
    
    -- Actualizar vehículo asociado si existe
    UPDATE public."NEW_Vehicles"
    SET 
      engine = CASE 
        WHEN engine_name IS NOT NULL AND engine_name != '' 
        THEN engine_name 
        ELSE engine 
      END,
      exterior_color = CASE 
        WHEN color_name IS NOT NULL AND color_name != 'Color no especificado' 
        THEN color_name 
        ELSE exterior_color 
      END,
      transmission_type = COALESCE(budget_info.engine_transmission, transmission_type),
      updated_at = now()
    WHERE project_id = NEW.project_id;
    
    -- Log para debugging
    RAISE NOTICE 'Proyecto actualizado con presupuesto primario: % - Modelo: %, Motor: %, Color: %', 
      NEW.project_id, model_name, engine_name, color_name;
      
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear el trigger
DROP TRIGGER IF EXISTS sync_project_info_from_primary_budget_trigger ON public."NEW_Budget";
CREATE TRIGGER sync_project_info_from_primary_budget_trigger
  AFTER UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  WHEN (NEW.is_primary = true AND (OLD.is_primary IS DISTINCT FROM NEW.is_primary OR OLD.model_option_id IS DISTINCT FROM NEW.model_option_id OR OLD.engine_option_id IS DISTINCT FROM NEW.engine_option_id OR OLD.exterior_color_id IS DISTINCT FROM NEW.exterior_color_id))
  EXECUTE FUNCTION public.sync_project_info_from_primary_budget();

-- También crear trigger para cuando se inserta un presupuesto primario
DROP TRIGGER IF EXISTS sync_project_info_from_primary_budget_insert_trigger ON public."NEW_Budget";
CREATE TRIGGER sync_project_info_from_primary_budget_insert_trigger
  AFTER INSERT ON public."NEW_Budget"
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.sync_project_info_from_primary_budget();