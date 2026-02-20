-- Actualizar el proyecto para que referencie correctamente el vehículo
UPDATE public."NEW_Projects" 
SET vehicle_id = '07ace1ed-91c7-4591-af60-5d770617856d'
WHERE id = '82618229-82c3-47ec-a69c-e15f6b306756';

-- Sincronizar manualmente los datos de vehículo existentes con los contratos
UPDATE public."NEW_Contracts" 
SET 
  vehicle_vin = v.numero_bastidor,
  vehicle_plate = v.matricula,
  vehicle_engine = v.engine,
  vehicle_model = CONCAT_WS(' ', 
    COALESCE(v.engine, ''), 
    COALESCE(v.transmission_type, ''), 
    CASE WHEN v.plazas IS NOT NULL THEN v.plazas || ' plazas' ELSE '' END
  ),
  updated_at = now()
FROM public."NEW_Vehicles" v
WHERE "NEW_Contracts".project_id = v.project_id 
AND "NEW_Contracts".is_latest = true
AND v.project_id = '82618229-82c3-47ec-a69c-e15f6b306756';