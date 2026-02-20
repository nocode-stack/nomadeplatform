-- Corregir la asignación de vehículos - solo debe haber un vehículo por proyecto
-- Primero, liberar todos los vehículos del proyecto
UPDATE "NEW_Vehicles" 
SET project_id = NULL 
WHERE project_id = '27405294-b010-485b-9130-0e89755635ab';

-- Luego, asignar solo el vehículo VH_25_001 (el que configuramos originalmente)
UPDATE "NEW_Vehicles" 
SET project_id = '27405294-b010-485b-9130-0e89755635ab'
WHERE id = 'db066f92-40ae-4759-8034-15e452eaa988';

-- También actualizar la referencia en NEW_Projects para que apunte al vehículo correcto
UPDATE "NEW_Projects" 
SET vehicle_id = 'db066f92-40ae-4759-8034-15e452eaa988'
WHERE id = '27405294-b010-485b-9130-0e89755635ab';