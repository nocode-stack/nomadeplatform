-- Corregir todos los contratos con DNI problemático
UPDATE "NEW_Contracts" 
SET client_dni = 'PENDIENTE'
WHERE client_dni IS NULL OR client_dni = 'N/A' OR client_dni = '';