-- Create NEW_Incident_Status table
CREATE TABLE public."NEW_Incident_Status" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for ordering
CREATE INDEX idx_new_incident_status_order ON public."NEW_Incident_Status"(order_index);

-- Add index for status_code lookups
CREATE INDEX idx_new_incident_status_code ON public."NEW_Incident_Status"(status_code);

-- Enable Row Level Security
ALTER TABLE public."NEW_Incident_Status" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view incident statuses" 
ON public."NEW_Incident_Status" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create incident statuses" 
ON public."NEW_Incident_Status" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update incident statuses" 
ON public."NEW_Incident_Status" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete incident statuses" 
ON public."NEW_Incident_Status" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for updating updated_at
CREATE TRIGGER update_new_incident_status_updated_at
  BEFORE UPDATE ON public."NEW_Incident_Status"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default incident statuses
INSERT INTO public."NEW_Incident_Status" (status_code, label, order_index) VALUES
('reportada', 'Reportada', 1),
('en_revision', 'En Revisión', 2),
('asignada', 'Asignada', 3),
('en_reparacion', 'En Reparación', 4),
('reparada', 'Reparada', 5),
('cerrada', 'Cerrada', 6);