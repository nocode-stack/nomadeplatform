-- Verificar y arreglar la foreign key de electric_system_id

-- Primero eliminar la constraint incorrecta
ALTER TABLE public."NEW_Budget" DROP CONSTRAINT IF EXISTS "NEW_Budget_electric_system_id_fkey";

-- Agregar la constraint correcta apuntando a NEW_Budget_Electric
ALTER TABLE public."NEW_Budget" 
ADD CONSTRAINT "NEW_Budget_electric_system_id_fkey" 
FOREIGN KEY (electric_system_id) REFERENCES public."NEW_Budget_Electric"(id);