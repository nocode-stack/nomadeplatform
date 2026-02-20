-- Agregar campo name a NEW_Projects para almacenar el nombre del proyecto
ALTER TABLE public."NEW_Projects" 
ADD COLUMN name TEXT;