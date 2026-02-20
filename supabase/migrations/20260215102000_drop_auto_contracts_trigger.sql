-- Drop the trigger that automatically creates contracts when a new project is created
DROP TRIGGER IF EXISTS trigger_create_project_contracts ON public."NEW_Projects";

-- Drop the function associated with the trigger
DROP FUNCTION IF EXISTS public.create_project_contracts();
