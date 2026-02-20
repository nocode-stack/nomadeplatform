-- Fix security vulnerability: Restrict user_profiles SELECT access to authenticated users only
-- Currently the table is publicly readable which exposes employee email addresses and phone numbers

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

-- Create a new secure SELECT policy that requires authentication
CREATE POLICY "Authenticated users can view all profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);