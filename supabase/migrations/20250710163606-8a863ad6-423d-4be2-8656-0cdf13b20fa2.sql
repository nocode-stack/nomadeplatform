-- Add billing_id to projects table to link with NEW_Billing
ALTER TABLE public.projects ADD COLUMN billing_id uuid REFERENCES public.NEW_Billing(id);

-- Add index for better performance
CREATE INDEX idx_projects_billing_id ON public.projects(billing_id);

-- Add RLS policies for NEW_Billing table
ALTER TABLE public.NEW_Billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all billing records" ON public.NEW_Billing
FOR SELECT USING (true);

CREATE POLICY "Users can create billing records" ON public.NEW_Billing
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update billing records" ON public.NEW_Billing
FOR UPDATE USING (true);

CREATE POLICY "Users can delete billing records" ON public.NEW_Billing
FOR DELETE USING (true);