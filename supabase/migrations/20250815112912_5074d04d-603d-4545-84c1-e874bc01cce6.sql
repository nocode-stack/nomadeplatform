-- Función para validar compatibilidad de vehículo con presupuesto primario
CREATE OR REPLACE FUNCTION public.validate_vehicle_budget_compatibility()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  vehicle_info RECORD;
  budget_info RECORD;
  project_vehicle_id UUID;
BEGIN
  -- Solo ejecutar cuando se marca un presupuesto como primario
  IF NEW.is_primary = true AND (OLD.is_primary IS NULL OR OLD.is_primary = false) THEN
    
    -- Obtener el vehículo asignado al proyecto
    SELECT vehicle_id INTO project_vehicle_id
    FROM public."NEW_Projects"
    WHERE id = NEW.project_id;
    
    -- Si no hay vehículo asignado, no hacer nada
    IF project_vehicle_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Obtener información del vehículo
    SELECT 
      exterior_color,
      plazas,
      transmission_type,
      engine
    INTO vehicle_info
    FROM public."NEW_Vehicles"
    WHERE id = project_vehicle_id;
    
    -- Obtener información del presupuesto con sus opciones
    SELECT 
      eco.name as exterior_color_name,
      eo.transmission,
      eo.name as engine_name
    INTO budget_info
    FROM public."NEW_Budget" b
    LEFT JOIN public.exterior_color_options eco ON b.exterior_color_id = eco.id
    LEFT JOIN public.engine_options eo ON b.engine_option_id = eo.id
    WHERE b.id = NEW.id;
    
    -- Validar compatibilidad
    -- Color exterior
    IF vehicle_info.exterior_color IS NOT NULL AND budget_info.exterior_color_name IS NOT NULL THEN
      IF LOWER(TRIM(vehicle_info.exterior_color)) != LOWER(TRIM(budget_info.exterior_color_name)) THEN
        -- Desasignar vehículo por incompatibilidad de color
        UPDATE public."NEW_Projects" 
        SET vehicle_id = NULL 
        WHERE id = NEW.project_id;
        
        UPDATE public."NEW_Vehicles" 
        SET project_id = NULL 
        WHERE id = project_vehicle_id;
        
        RAISE NOTICE 'Vehículo desasignado: color exterior no coincide. Vehículo: %, Presupuesto: %', 
          vehicle_info.exterior_color, budget_info.exterior_color_name;
        
        RETURN NEW;
      END IF;
    END IF;
    
    -- Transmisión
    IF vehicle_info.transmission_type IS NOT NULL AND budget_info.transmission IS NOT NULL THEN
      IF LOWER(TRIM(vehicle_info.transmission_type)) != LOWER(TRIM(budget_info.transmission)) THEN
        -- Desasignar vehículo por incompatibilidad de transmisión
        UPDATE public."NEW_Projects" 
        SET vehicle_id = NULL 
        WHERE id = NEW.project_id;
        
        UPDATE public."NEW_Vehicles" 
        SET project_id = NULL 
        WHERE id = project_vehicle_id;
        
        RAISE NOTICE 'Vehículo desasignado: transmisión no coincide. Vehículo: %, Presupuesto: %', 
          vehicle_info.transmission_type, budget_info.transmission;
        
        RETURN NEW;
      END IF;
    END IF;
    
    -- Motor/Potencia (comparación más flexible)
    IF vehicle_info.engine IS NOT NULL AND budget_info.engine_name IS NOT NULL THEN
      -- Extraer potencia del motor del vehículo y del presupuesto
      IF NOT (vehicle_info.engine ILIKE '%' || budget_info.engine_name || '%' OR 
              budget_info.engine_name ILIKE '%' || vehicle_info.engine || '%') THEN
        -- Desasignar vehículo por incompatibilidad de motor
        UPDATE public."NEW_Projects" 
        SET vehicle_id = NULL 
        WHERE id = NEW.project_id;
        
        UPDATE public."NEW_Vehicles" 
        SET project_id = NULL 
        WHERE id = project_vehicle_id;
        
        RAISE NOTICE 'Vehículo desasignado: motor no coincide. Vehículo: %, Presupuesto: %', 
          vehicle_info.engine, budget_info.engine_name;
        
        RETURN NEW;
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear trigger para validar compatibilidad cuando se cambia presupuesto primario
DROP TRIGGER IF EXISTS validate_vehicle_budget_compatibility_trigger ON public."NEW_Budget";
CREATE TRIGGER validate_vehicle_budget_compatibility_trigger
  AFTER UPDATE ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_vehicle_budget_compatibility();