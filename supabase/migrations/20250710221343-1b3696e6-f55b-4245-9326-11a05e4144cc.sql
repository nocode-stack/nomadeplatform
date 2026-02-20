-- Corregir la foreign key de NEW_Projects.vehicle_id para que apunte a NEW_Vehicles
ALTER TABLE "NEW_Projects" 
DROP CONSTRAINT IF EXISTS "NEW_Projects_vehicle_id_fkey";

-- Crear la foreign key correcta que referencia NEW_Vehicles
ALTER TABLE "NEW_Projects" 
ADD CONSTRAINT "NEW_Projects_vehicle_id_fkey" 
FOREIGN KEY ("vehicle_id") REFERENCES "NEW_Vehicles"("id") ON DELETE SET NULL;