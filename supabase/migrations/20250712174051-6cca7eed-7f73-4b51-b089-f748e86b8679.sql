-- Agregar campo is_latest a la tabla NEW_Contracts
ALTER TABLE "NEW_Contracts" ADD COLUMN is_latest BOOLEAN DEFAULT true;