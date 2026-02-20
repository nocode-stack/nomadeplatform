-- Asignar un vehículo disponible al proyecto actual
-- Primero verificamos que el vehículo no esté asignado a otro proyecto
UPDATE "NEW_Projects" 
SET vehicle_id = 'db066f92-40ae-4759-8034-15e452eaa988'
WHERE id = '27405294-b010-485b-9130-0e89755635ab';

-- También actualizar la relación inversa en el vehículo
UPDATE "NEW_Vehicles"
SET project_id = '27405294-b010-485b-9130-0e89755635ab'
WHERE id = 'db066f92-40ae-4759-8034-15e452eaa988';