-- Recrear la clave externa de NEW_Production_Schedule hacia NEW_Projects con ON DELETE SET NULL
-- Esto permite borrar un proyecto (y por tanto un cliente) sin que el error de restricción lo bloquee.
-- El hueco en el calendario de producción se mantendrá, pero con project_id = NULL.

ALTER TABLE "NEW_Production_Schedule" 
DROP CONSTRAINT IF EXISTS "NEW_Production_Schedule_project_id_fkey";

ALTER TABLE "NEW_Production_Schedule" 
ADD CONSTRAINT "NEW_Production_Schedule_project_id_fkey" 
FOREIGN KEY ("project_id") 
REFERENCES "NEW_Projects"("id") 
ON DELETE SET NULL;
