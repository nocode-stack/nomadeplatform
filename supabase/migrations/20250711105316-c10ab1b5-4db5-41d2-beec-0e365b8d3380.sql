-- Fix RLS policy for notifications to allow creating notifications for other users
-- This is necessary for mentions system where user A can create notifications for user B

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to create notifications for anyone" ON public.notifications;

-- Create a new policy that allows authenticated users to create notifications for any user
CREATE POLICY "Allow authenticated users to create notifications for anyone" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure we can update notifications created for mentions
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;

CREATE POLICY "Allow users to update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);