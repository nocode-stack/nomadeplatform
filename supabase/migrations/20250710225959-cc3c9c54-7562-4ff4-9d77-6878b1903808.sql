-- Crear variantes de configuraciones de vehículos con las especificaciones solicitadas

-- Insertar nuevas configuraciones de vehículos con variaciones de motor, color y plazas
INSERT INTO public."NEW_Vehicles_Settings" (name, engine, transmission, color, dimensions, price, is_active, order_index)
VALUES 
  -- 140cv Manual Blanca 2 plazas
  ('Furgón 140cv Manual Blanca 2 plazas', '140cv', 'Manual', 'Blanca', 'L2H2', 35000, true, 2),
  
  -- 180cv Automática Blanca 3 plazas  
  ('Furgón 180cv Automática Blanca 3 plazas', '180cv', 'Automática', 'Blanca', 'L3H2', 42000, true, 3),
  
  -- 140cv Manual Gris 3 plazas
  ('Furgón 140cv Manual Gris 3 plazas', '140cv', 'Manual', 'Gris', 'L3H2', 37000, true, 4),
  
  -- 180cv Automática Gris 2 plazas
  ('Furgón 180cv Automática Gris 2 plazas', '180cv', 'Automática', 'Gris', 'L2H2', 40000, true, 5);

-- Redistribuir los vehículos existentes entre las diferentes configuraciones
WITH vehicle_settings AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) as rn 
  FROM public."NEW_Vehicles_Settings" 
  WHERE is_active = true
),
vehicles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn 
  FROM public."NEW_Vehicles"
)
UPDATE public."NEW_Vehicles" 
SET vehicle_settings_id = vs.id
FROM vehicle_settings vs, vehicles v
WHERE public."NEW_Vehicles".id = v.id 
  AND vs.rn = ((v.rn - 1) % (SELECT COUNT(*) FROM vehicle_settings)) + 1;