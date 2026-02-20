-- Actualizar el contrato de reserva con los datos correctos del vehículo
UPDATE "NEW_Contracts" 
SET 
  vehicle_vin = v.numero_bastidor,
  vehicle_plate = v.matricula,
  vehicle_engine = v.engine,
  vehicle_model = CONCAT_WS(' ', v.engine, v.transmission_type, v.plazas, 'plazas'),
  updated_at = now()
FROM "NEW_Projects" p
JOIN "NEW_Vehicles" v ON p.vehicle_id = v.id
WHERE "NEW_Contracts".project_id = p.id 
  AND "NEW_Contracts".contract_type = 'reservation'
  AND "NEW_Contracts".is_latest = true
  AND "NEW_Contracts".project_id = '82618229-82c3-47ec-a69c-e15f6b306756';