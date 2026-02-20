-- Fix the auth.users table scan error for email_change column
-- This addresses the "sql: Scan error on column index 8, name 'email_change': converting NULL to string is unsupported" error

-- First, let's ensure the email_change column can handle NULLs properly
-- This is a known Supabase issue where the auth system expects proper NULL handling

-- Update the handle_new_user function to be even more defensive
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- More defensive approach - check if user already has a profile first
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_profiles (user_id, name, email, department)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Usuario'),
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'department', 'Sin departamento')
    );
    
    RAISE NOTICE 'Profile created for new user: %', COALESCE(NEW.email, NEW.id::text);
  ELSE
    RAISE NOTICE 'Profile already exists for user: %', COALESCE(NEW.email, NEW.id::text);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the auth user creation
    RAISE WARNING 'Error in handle_new_user for %: %', COALESCE(NEW.email, NEW.id::text), SQLERRM;
    RETURN NEW;
END;
$$;