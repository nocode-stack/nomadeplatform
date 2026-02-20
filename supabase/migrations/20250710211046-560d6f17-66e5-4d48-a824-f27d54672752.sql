-- Eliminar la restricción incorrecta de NEW_Projects.slot_id
ALTER TABLE "NEW_Projects" 
DROP CONSTRAINT IF EXISTS "NEW_Projects_slot_id_fkey";

-- Crear la restricción correcta que referencia NEW_Production_Schedule
ALTER TABLE "NEW_Projects" 
ADD CONSTRAINT "NEW_Projects_slot_id_fkey" 
FOREIGN KEY ("slot_id") REFERENCES "NEW_Production_Schedule"("id");