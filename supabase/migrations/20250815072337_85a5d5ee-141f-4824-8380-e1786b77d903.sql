-- Fix RLS Disabled security issue for production_schedule table
-- This table currently has RLS disabled, exposing all production scheduling data

-- Enable Row Level Security on production_schedule table
ALTER TABLE public.production_schedule ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for production_schedule table
-- Allow authenticated users to view production schedule (needed for planning)
CREATE POLICY "Authenticated users can view production schedule" 
ON public.production_schedule 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create production schedule entries
CREATE POLICY "Authenticated users can create production schedule" 
ON public.production_schedule 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update production schedule entries
CREATE POLICY "Authenticated users can update production schedule" 
ON public.production_schedule 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete production schedule entries (needed for schedule management)
CREATE POLICY "Authenticated users can delete production schedule" 
ON public.production_schedule 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);