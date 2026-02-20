-- Improve the handle_new_user trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert user profile with ON CONFLICT DO NOTHING to prevent duplicates
  INSERT INTO public.user_profiles (user_id, name, email, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Sin departamento')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Profile created or already exists for user: %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the auth user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;