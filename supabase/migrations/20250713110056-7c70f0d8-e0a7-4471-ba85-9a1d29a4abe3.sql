-- Agregar campo comercial a la tabla NEW_Projects
ALTER TABLE "NEW_Projects" 
ADD COLUMN comercial text;

-- Establecer un valor por defecto para registros existentes
UPDATE "NEW_Projects" 
SET comercial = 'Arnau' 
WHERE comercial IS NULL;