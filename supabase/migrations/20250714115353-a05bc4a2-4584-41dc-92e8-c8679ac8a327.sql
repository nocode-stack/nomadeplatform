-- Crear función para sincronizar información del presupuesto primario con proyecto y vehículo
CREATE OR REPLACE FUNCTION public.sync_project_info_from_primary_budget()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  budget_info RECORD;
  model_name TEXT;
  engine_name TEXT;
  color_name TEXT;
  client_info RECORD;
BEGIN
  -- Proceder si:
  -- 1. Se marca como primario (INSERT o UPDATE)
  -- 2. Se actualiza información relevante de un presupuesto que YA es primario
  -- 3. Se actualiza cualquier información relevante de un presupuesto primario
  IF (TG_OP = 'INSERT' AND NEW.is_primary = true) OR
     (TG_OP = 'UPDATE' AND (
       NEW.is_primary = true OR -- Se está marcando como primario
       (OLD.is_primary = true AND NEW.is_primary = true AND ( -- Ya era primario y se actualiza info relevante
         OLD.model_option_id IS DISTINCT FROM NEW.model_option_id OR
         OLD.engine_option_id IS DISTINCT FROM NEW.engine_option_id OR
         OLD.exterior_color_id IS DISTINCT FROM NEW.exterior_color_id
       ))
     )) THEN
    
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
    
    -- Construir nombre del motor completo (sin duplicaciones)
    engine_name := TRIM(CONCAT_WS(' ', 
      COALESCE(budget_info.engine_option_name, ''),
      CASE 
        WHEN budget_info.engine_option_name IS NULL OR budget_info.engine_option_name = '' 
        THEN COALESCE(budget_info.engine_power, '')
        ELSE ''
      END,
      CASE 
        WHEN budget_info.engine_option_name IS NULL OR budget_info.engine_option_name = '' 
        THEN COALESCE(budget_info.engine_transmission, '')
        ELSE ''
      END
    ));
    
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
    
    -- Log para debugging con más información
    RAISE NOTICE 'Sincronizando vehículo del proyecto: % - Presupuesto ID: % - Motor: % - Color: % - Es primario: %', 
      NEW.project_id, NEW.id, engine_name, color_name, NEW.is_primary;
      
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para cuando se actualiza o inserta un presupuesto
CREATE OR REPLACE TRIGGER sync_project_info_from_primary_budget_trigger
  AFTER INSERT OR UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_info_from_primary_budget();