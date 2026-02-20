-- CRITICAL SECURITY FIX: NEW_Contracts table publicly readable
-- The current SELECT policy allows anyone (even unauthenticated users) to read sensitive contract data
-- including IBAN bank details, client DNI, emails, phone numbers, and financial information

-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Users can view all contracts" ON public."NEW_Contracts";

-- Create secure SELECT policy requiring authentication
CREATE POLICY "Authenticated users can view contracts" 
ON public."NEW_Contracts" 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Verify RLS is enabled (it should already be enabled)
ALTER TABLE public."NEW_Contracts" ENABLE ROW LEVEL SECURITY;