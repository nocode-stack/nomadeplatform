-- Migrar datos de vehicles a NEW_Vehicles
-- Primero necesitamos obtener un vehicle_option_id por defecto ya que es obligatorio en NEW_Vehicles
-- pero no existe en la tabla vehicles original

-- Obtener el primer vehicle_option disponible como valor por defecto
DO $$
DECLARE
    default_vehicle_option_id uuid;
BEGIN
    -- Buscar el primer vehicle_option_id disponible
    SELECT id INTO default_vehicle_option_id 
    FROM vehicle_options 
    WHERE is_active = true 
    LIMIT 1;
    
    -- Si no hay vehicle_options, crear uno por defecto
    IF default_vehicle_option_id IS NULL THEN
        INSERT INTO vehicle_options (name, power, transmission, price, is_active)
        VALUES ('Configuración por defecto', 'Por definir', 'Por definir', 0, true)
        RETURNING id INTO default_vehicle_option_id;
    END IF;
    
    -- Migrar datos de vehicles a NEW_Vehicles
    INSERT INTO public."NEW_Vehicles" (
        id,
        vehicle_code, -- Se generará automáticamente por el trigger
        numero_bastidor,
        matricula,
        vehicle_option_id,
        project_id,
        proveedor,
        estado_pago,
        fecha_pago,
        location,
        created_at,
        updated_at
    )
    SELECT 
        v.id,
        '', -- vehicle_code se generará automáticamente
        v.numero_bastidor,
        v.matricula,
        default_vehicle_option_id, -- Usar el vehicle_option por defecto
        v.project_id,
        v.proveedor,
        v.estado_pago,
        v.fecha_pago,
        v.ubicacion, -- Mapear ubicacion a location
        v.created_at,
        v.updated_at
    FROM vehicles v
    WHERE NOT EXISTS (
        -- Evitar duplicados si la migración se ejecuta varias veces
        SELECT 1 FROM public."NEW_Vehicles" nv WHERE nv.id = v.id
    );
    
    RAISE NOTICE 'Migración completada. Se usó vehicle_option_id: % como valor por defecto', default_vehicle_option_id;
END $$;