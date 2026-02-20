-- Agregar campos adicionales para los contratos
ALTER TABLE public."NEW_Contracts" 
ADD COLUMN vehicle_engine text,
ADD COLUMN delivery_months integer;