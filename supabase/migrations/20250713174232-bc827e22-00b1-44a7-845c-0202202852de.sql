-- Arreglar las referencias de claves foráneas en NEW_Budget

-- Primero, eliminar cualquier constraint existente que pueda estar causando problemas
DO $$ 
BEGIN
  -- Eliminar constraint de electric_system_id si existe y apunta a tabla incorrecta
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'NEW_Budget_electric_system_id_fkey' 
    AND table_name = 'NEW_Budget'
  ) THEN
    ALTER TABLE public."NEW_Budget" DROP CONSTRAINT "NEW_Budget_electric_system_id_fkey";
  END IF;
END $$;

-- Agregar las claves foráneas correctas
ALTER TABLE public."NEW_Budget" 
ADD CONSTRAINT "NEW_Budget_engine_option_id_fkey" 
FOREIGN KEY (engine_option_id) REFERENCES public.engine_options(id);

ALTER TABLE public."NEW_Budget" 
ADD CONSTRAINT "NEW_Budget_model_option_id_fkey" 
FOREIGN KEY (model_option_id) REFERENCES public.model_options(id);

ALTER TABLE public."NEW_Budget" 
ADD CONSTRAINT "NEW_Budget_exterior_color_id_fkey" 
FOREIGN KEY (exterior_color_id) REFERENCES public.exterior_color_options(id);

ALTER TABLE public."NEW_Budget" 
ADD CONSTRAINT "NEW_Budget_pack_id_fkey" 
FOREIGN KEY (pack_id) REFERENCES public."NEW_Budget_Packs"(id);

ALTER TABLE public."NEW_Budget" 
ADD CONSTRAINT "NEW_Budget_electric_system_id_fkey" 
FOREIGN KEY (electric_system_id) REFERENCES public."NEW_Budget_Electric"(id);