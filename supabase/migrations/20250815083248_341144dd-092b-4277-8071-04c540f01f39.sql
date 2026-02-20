-- Create function to delete user from auth.users when profile is deleted
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the user from auth.users using Supabase's admin function
  -- This will cascade and clean up all related auth data
  PERFORM auth.admin_delete_user(OLD.user_id);
  
  -- Log the deletion for auditing purposes
  RAISE NOTICE 'User % deleted from auth.users after profile deletion', OLD.user_id;
  
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent the profile deletion
    RAISE WARNING 'Failed to delete user % from auth.users: %', OLD.user_id, SQLERRM;
    RETURN OLD;
END;
$$;

-- Create trigger to automatically delete auth user when profile is deleted
CREATE TRIGGER delete_auth_user_trigger
  AFTER DELETE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();

-- Update RLS policy to allow users to delete their own profile
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

CREATE POLICY "Users can delete their own profile"
ON public.user_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Allow admins to delete any profile (assuming you have admin role logic)
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.user_profiles;

CREATE POLICY "Admins can delete any profile"
ON public.user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.department = 'CEO'
  )
);