-- Restaurar datos del vehículo en el contrato de reserva
UPDATE "NEW_Contracts" 
SET 
  vehicle_vin = v.numero_bastidor,
  vehicle_plate = v.matricula,
  vehicle_engine = v.engine,
  vehicle_model = CONCAT_WS(' ', v.engine, v.transmission_type, CASE WHEN v.plazas IS NOT NULL THEN v.plazas || ' plazas' ELSE '' END),
  updated_at = now()
FROM "NEW_Projects" p
JOIN "NEW_Vehicles" v ON p.vehicle_id = v.id
WHERE "NEW_Contracts".project_id = p.id 
  AND "NEW_Contracts".contract_type = 'reservation'
  AND "NEW_Contracts".is_latest = true
  AND "NEW_Contracts".project_id = '82618229-82c3-47ec-a69c-e15f6b306756';