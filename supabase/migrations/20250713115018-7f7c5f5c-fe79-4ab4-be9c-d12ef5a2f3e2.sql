-- Create NEW_Budget_Discounts table
CREATE TABLE public."NEW_Budget_Discounts" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public."NEW_Budget_Discounts" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all budget discounts" 
ON public."NEW_Budget_Discounts" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create budget discounts" 
ON public."NEW_Budget_Discounts" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budget discounts" 
ON public."NEW_Budget_Discounts" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budget discounts" 
ON public."NEW_Budget_Discounts" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at column
CREATE TRIGGER trigger_update_new_budget_discounts_updated_at
BEFORE UPDATE ON public."NEW_Budget_Discounts"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_new_budget_discounts_code ON public."NEW_Budget_Discounts"(code);
CREATE INDEX idx_new_budget_discounts_is_active ON public."NEW_Budget_Discounts"(is_active);
CREATE INDEX idx_new_budget_discounts_active_codes ON public."NEW_Budget_Discounts"(code, is_active);

-- Insert some sample discount reasons
INSERT INTO public."NEW_Budget_Discounts" (code, label, description, is_active) VALUES
('fair', 'Descuento Feria', 'Descuento aplicado por promoción en feria o evento', true),
('dealer', 'Descuento Concesionario', 'Descuento especial para concesionarios y dealers', true),
('close_deal', 'Cierre de Trato', 'Descuento para cerrar venta rápidamente', true),
('loyal_customer', 'Cliente Fiel', 'Descuento por fidelidad de cliente recurrente', true),
('bulk_purchase', 'Compra al Mayor', 'Descuento por compra de múltiples unidades', true),
('end_of_season', 'Fin de Temporada', 'Liquidación de inventario de temporada', true),
('damaged_unit', 'Unidad Dañada', 'Descuento por daños menores en la unidad', true),
('early_payment', 'Pago Anticipado', 'Descuento por pago completo por adelantado', true);