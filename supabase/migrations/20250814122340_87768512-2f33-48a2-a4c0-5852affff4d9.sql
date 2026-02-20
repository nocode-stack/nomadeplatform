-- Fix critical security vulnerability: Restrict NEW_Clients table access to authenticated users only
-- Currently the table allows ALL operations to everyone, exposing sensitive customer data
-- This includes emails, phone numbers, DNI (national ID), addresses, and birthdates

-- Drop the existing overly permissive policy that allows all access to everyone
DROP POLICY IF EXISTS "Enable all access for now" ON public."NEW_Clients";

-- Create secure RLS policies that require authentication

-- Allow authenticated users to view all client records (needed for business operations)
CREATE POLICY "Authenticated users can view all clients" 
ON public."NEW_Clients" 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create new client records
CREATE POLICY "Authenticated users can create clients" 
ON public."NEW_Clients" 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update client records
CREATE POLICY "Authenticated users can update clients" 
ON public."NEW_Clients" 
FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete client records (needed for data management)
CREATE POLICY "Authenticated users can delete clients" 
ON public."NEW_Clients" 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);