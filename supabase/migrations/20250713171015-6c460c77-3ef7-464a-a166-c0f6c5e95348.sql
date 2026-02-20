-- FASE 1: Completar estructura de NEW_Budget
-- Agregar campos faltantes a NEW_Budget
ALTER TABLE public."NEW_Budget" 
ADD COLUMN iva_rate NUMERIC(4,2) DEFAULT 21.00,
ADD COLUMN client_name TEXT,
ADD COLUMN client_email TEXT,
ADD COLUMN client_phone TEXT,
ADD COLUMN client_address TEXT,
ADD COLUMN valid_until DATE,
ADD COLUMN description TEXT,
ADD COLUMN budget_number TEXT;

-- Crear función para generar número de presupuesto
CREATE OR REPLACE FUNCTION public.generate_new_budget_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  new_budget_number TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(budget_number, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Budget"
  WHERE budget_number LIKE 'BG_' || year_suffix || '%';
  
  -- Format: BG_año(2 dígitos)_número secuencial(3 dígitos)
  new_budget_number := 'BG_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_budget_number;
END;
$$;

-- Trigger para auto-generar número de presupuesto
CREATE OR REPLACE FUNCTION public.set_new_budget_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.budget_number IS NULL OR NEW.budget_number = '' THEN
    NEW.budget_number := generate_new_budget_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger
CREATE TRIGGER trigger_set_new_budget_number
  BEFORE INSERT ON public."NEW_Budget"
  FOR EACH ROW
  EXECUTE FUNCTION set_new_budget_number();

-- Función para calcular totales automáticamente
CREATE OR REPLACE FUNCTION public.calculate_new_budget_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  budget_subtotal NUMERIC(10,2);
  budget_iva_amount NUMERIC(10,2);
  budget_total NUMERIC(10,2);
  iva_rate NUMERIC(4,2);
BEGIN
  -- Obtener la tasa de IVA del presupuesto
  SELECT b.iva_rate INTO iva_rate
  FROM public."NEW_Budget" b
  WHERE b.id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Si no hay tasa de IVA, usar 21% por defecto
  IF iva_rate IS NULL THEN
    iva_rate := 21.00;
  END IF;
  
  -- Calcular subtotal
  SELECT COALESCE(SUM(line_total), 0)
  INTO budget_subtotal
  FROM public."NEW_Budget_Items"
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Calcular IVA
  budget_iva_amount := budget_subtotal * (iva_rate / 100);
  
  -- Calcular total
  budget_total := budget_subtotal + budget_iva_amount;
  
  -- Actualizar presupuesto
  UPDATE public."NEW_Budget"
  SET 
    subtotal = budget_subtotal,
    total = budget_total,
    updated_at = now()
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Crear triggers para recalcular totales
CREATE TRIGGER trigger_calculate_budget_totals_insert
  AFTER INSERT ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION calculate_new_budget_totals();

CREATE TRIGGER trigger_calculate_budget_totals_update
  AFTER UPDATE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION calculate_new_budget_totals();

CREATE TRIGGER trigger_calculate_budget_totals_delete
  AFTER DELETE ON public."NEW_Budget_Items"
  FOR EACH ROW
  EXECUTE FUNCTION calculate_new_budget_totals();

-- Agregar índices para mejorar rendimiento
CREATE INDEX idx_new_budget_items_budget_id ON public."NEW_Budget_Items"(budget_id);
CREATE INDEX idx_new_budget_project_id ON public."NEW_Budget"(project_id);
CREATE INDEX idx_new_budget_status ON public."NEW_Budget"(status);

-- Crear tabla para historial de cambios (opcional para auditoria)
CREATE TABLE public."NEW_Budget_History" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public."NEW_Budget"(id) ON DELETE CASCADE,
  changed_by UUID,
  change_type TEXT NOT NULL, -- 'item_added', 'item_removed', 'discount_applied', etc.
  change_description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para budget history
ALTER TABLE public."NEW_Budget_History" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget history" ON public."NEW_Budget_History"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create budget history" ON public."NEW_Budget_History"
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);