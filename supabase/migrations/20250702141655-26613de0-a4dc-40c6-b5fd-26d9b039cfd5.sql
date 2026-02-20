
-- Añadir campo para descuento general al presupuesto si no existe
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS general_discount_percentage numeric DEFAULT 0;

-- Crear tabla para almacenar PDFs de presupuestos
CREATE TABLE IF NOT EXISTS budget_pdfs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  pdf_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en la tabla de PDFs
ALTER TABLE budget_pdfs ENABLE ROW LEVEL SECURITY;

-- Políticas para PDFs de presupuestos
CREATE POLICY "Users can view budget PDFs" ON budget_pdfs FOR SELECT USING (true);
CREATE POLICY "Users can create budget PDFs" ON budget_pdfs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete budget PDFs" ON budget_pdfs FOR DELETE USING (true);

-- Crear bucket para PDFs de presupuestos si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('budget-pdfs', 'budget-pdfs', true)
ON CONFLICT (id) DO NOTHING;
