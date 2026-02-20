-- Update NEW_Budget_Electric with correct electric systems
TRUNCATE TABLE "NEW_Budget_Electric" RESTART IDENTITY CASCADE;

INSERT INTO "NEW_Budget_Electric" (name, description, price, discount_price, system_type, order_index, is_active, is_standalone) VALUES
('Litio', 'Sistema eléctrico básico de litio', 0, NULL, 'basic', 1, true, true),
('Litio+', 'Sistema eléctrico de litio mejorado', 2500, NULL, 'enhanced', 2, true, true),
('Pro', 'Sistema eléctrico profesional', 5000, NULL, 'professional', 3, true, true);

-- Update NEW_Budget_Packs with correct packs
TRUNCATE TABLE "NEW_Budget_Packs" RESTART IDENTITY CASCADE;

INSERT INTO "NEW_Budget_Packs" (name, description, price, is_active) VALUES
('Essentials', 'Pack básico con elementos esenciales', 1500, true),
('Adventure', 'Pack para aventureros con equipamiento adicional', 3000, true),
('Ultimate', 'Pack completo con todas las opciones', 5000, true);

-- Create table for additional items
CREATE TABLE IF NOT EXISTS "NEW_Budget_Additional_Items" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'additional',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert additional items
INSERT INTO "NEW_Budget_Additional_Items" (name, description, price, category, order_index, is_active) VALUES
('Aire Acondicionado', 'Sistema de climatización', 1200, 'comfort', 1, true),
('Microondas', 'Horno microondas integrado', 800, 'appliances', 2, true);

-- Enable RLS
ALTER TABLE "NEW_Budget_Additional_Items" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for NEW_Budget_Additional_Items
CREATE POLICY "Users can view all additional items" ON "NEW_Budget_Additional_Items"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create additional items" ON "NEW_Budget_Additional_Items"
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update additional items" ON "NEW_Budget_Additional_Items"
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete additional items" ON "NEW_Budget_Additional_Items"
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_new_budget_additional_items_updated_at
    BEFORE UPDATE ON "NEW_Budget_Additional_Items"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();