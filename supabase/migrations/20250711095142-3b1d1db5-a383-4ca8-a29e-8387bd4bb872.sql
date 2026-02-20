-- Enable RLS for NEW_Incidents table
ALTER TABLE public."NEW_Incidents" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for NEW_Incidents
CREATE POLICY "Users can view all incidents" 
ON public."NEW_Incidents" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create incidents" 
ON public."NEW_Incidents" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update incidents" 
ON public."NEW_Incidents" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete incidents" 
ON public."NEW_Incidents" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Enable RLS for NEW_Incident_Items table
ALTER TABLE public."NEW_Incident_Items" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for NEW_Incident_Items
CREATE POLICY "Users can view all incident items" 
ON public."NEW_Incident_Items" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create incident items" 
ON public."NEW_Incident_Items" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update incident items" 
ON public."NEW_Incident_Items" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete incident items" 
ON public."NEW_Incident_Items" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add reference_number column to NEW_Incidents
ALTER TABLE public."NEW_Incidents" 
ADD COLUMN reference_number text UNIQUE;

-- Create function to generate incident reference number
CREATE OR REPLACE FUNCTION public.generate_incident_reference_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  reference_number TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(reference_number, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM "NEW_Incidents"
  WHERE reference_number LIKE 'IN_' || year_suffix || '%';
  
  -- Format: IN_ + año(2 dígitos) + _ + número secuencial(3 dígitos)
  reference_number := 'IN_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN reference_number;
END;
$function$;

-- Create trigger function to set reference number
CREATE OR REPLACE FUNCTION public.set_incident_reference_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_incident_reference_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-generate reference number
CREATE TRIGGER trigger_set_incident_reference_number
  BEFORE INSERT ON public."NEW_Incidents"
  FOR EACH ROW
  EXECUTE FUNCTION set_incident_reference_number();