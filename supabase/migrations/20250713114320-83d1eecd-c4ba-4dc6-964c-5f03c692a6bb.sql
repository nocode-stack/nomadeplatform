-- Create NEW_Budget_Structure table
CREATE TABLE public."NEW_Budget_Structure" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_code TEXT NOT NULL,
  budget_type TEXT NOT NULL DEFAULT 'project',
  project_id UUID REFERENCES public."NEW_Projects"(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public."NEW_Incidents"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add constraint to ensure either project_id or incident_id is set, but not both
  CONSTRAINT check_budget_target CHECK (
    (project_id IS NOT NULL AND incident_id IS NULL) OR
    (project_id IS NULL AND incident_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public."NEW_Budget_Structure" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all budgets" 
ON public."NEW_Budget_Structure" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create budgets" 
ON public."NEW_Budget_Structure" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update budgets" 
ON public."NEW_Budget_Structure" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete budgets" 
ON public."NEW_Budget_Structure" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create function to generate budget code
CREATE OR REPLACE FUNCTION public.generate_new_budget_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  budget_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(budget_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Budget_Structure"
  WHERE budget_code LIKE 'BG_' || year_suffix || '%';
  
  -- Format: BG_año(2 dígitos)_número secuencial(3 dígitos)
  budget_code := 'BG_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN budget_code;
END;
$$;

-- Create trigger to auto-generate budget code
CREATE OR REPLACE FUNCTION public.set_new_budget_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.budget_code IS NULL OR NEW.budget_code = '' THEN
    NEW.budget_code := generate_new_budget_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_new_budget_code
BEFORE INSERT ON public."NEW_Budget_Structure"
FOR EACH ROW
EXECUTE FUNCTION public.set_new_budget_code();

-- Create trigger to update updated_at column
CREATE TRIGGER trigger_update_new_budget_updated_at
BEFORE UPDATE ON public."NEW_Budget_Structure"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();