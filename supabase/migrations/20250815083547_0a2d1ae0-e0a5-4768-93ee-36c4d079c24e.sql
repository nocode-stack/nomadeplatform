-- Create a function to delete all users except the specified email
CREATE OR REPLACE FUNCTION public.delete_users_except_email(keep_email text)
RETURNS TABLE(deleted_email text, deleted_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return the users that will be deleted for confirmation
  RETURN QUERY
  DELETE FROM user_profiles 
  WHERE email != keep_email 
  RETURNING email, name;
END;
$$;

-- Execute the deletion keeping only iribo@nomade-nation.com
SELECT * FROM public.delete_users_except_email('iribo@nomade-nation.com');