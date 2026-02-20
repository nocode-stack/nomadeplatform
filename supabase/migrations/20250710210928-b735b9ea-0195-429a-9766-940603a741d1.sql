-- Eliminar la restricción incorrecta que referencia la tabla projects
ALTER TABLE "NEW_Production_Schedule" 
DROP CONSTRAINT IF EXISTS "NEW_Production_Schedule_project_id_fkey";

-- Eliminar también la restricción con nombre diferente si existe
ALTER TABLE "NEW_Production_Schedule" 
DROP CONSTRAINT IF EXISTS "new_production_schedule_project_id_fkey";

-- Crear la restricción correcta que referencia NEW_Projects
ALTER TABLE "NEW_Production_Schedule" 
ADD CONSTRAINT "NEW_Production_Schedule_project_id_fkey" 
FOREIGN KEY ("project_id") REFERENCES "NEW_Projects"("id");

-- Recrear el índice si no existe
DROP INDEX IF EXISTS idx_new_production_schedule_project_id;
CREATE INDEX idx_new_production_schedule_project_id ON "NEW_Production_Schedule"("project_id");