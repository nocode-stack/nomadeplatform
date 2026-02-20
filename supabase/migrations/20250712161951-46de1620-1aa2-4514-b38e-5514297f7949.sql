-- Arreglar el problema del vehicle_id en NEW_Projects
-- Cambiar el default para que sea NULL en lugar de gen_random_uuid()
ALTER TABLE "NEW_Projects" 
ALTER COLUMN "vehicle_id" SET DEFAULT NULL;