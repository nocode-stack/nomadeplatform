
-- Step 1: Clean up duplicate projects
-- First, let's identify and remove the duplicate Nachito Martinez projects
-- Keep only the one that's properly assigned (N2560)

-- Remove duplicate projects N2561 and N2562
DELETE FROM projects 
WHERE code IN ('N2561', 'N2562') 
AND name = 'Nachito Martinez';

-- Step 2: Add unique constraint to prevent duplicate codes
ALTER TABLE projects 
ADD CONSTRAINT projects_code_unique UNIQUE (code);

-- Step 3: Improve project_codes assignment integrity
-- Add a trigger to ensure project_codes status is properly updated when projects are created
CREATE OR REPLACE FUNCTION update_project_code_on_project_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the project has a production_code_id, update the corresponding project_code
  IF NEW.production_code_id IS NOT NULL THEN
    UPDATE project_codes 
    SET status = 'assigned',
        project_id = NEW.id,
        updated_at = now()
    WHERE id = NEW.production_code_id
    AND status = 'available';
    
    -- If no rows were updated, it means the code wasn't available
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Project code is not available for assignment';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_project_code_on_creation ON projects;
CREATE TRIGGER trigger_update_project_code_on_creation
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_code_on_project_creation();

-- Step 4: Add function to handle project code reassignment during updates
CREATE OR REPLACE FUNCTION handle_project_code_reassignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If production_code_id changed
  IF OLD.production_code_id IS DISTINCT FROM NEW.production_code_id THEN
    
    -- Release old code if it existed
    IF OLD.production_code_id IS NOT NULL THEN
      UPDATE project_codes 
      SET status = 'available',
          project_id = NULL,
          updated_at = now()
      WHERE id = OLD.production_code_id;
    END IF;
    
    -- Assign new code if provided
    IF NEW.production_code_id IS NOT NULL THEN
      UPDATE project_codes 
      SET status = 'assigned',
          project_id = NEW.id,
          updated_at = now()
      WHERE id = NEW.production_code_id
      AND status = 'available';
      
      -- If no rows were updated, the code wasn't available
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Project code is not available for assignment';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the update trigger
DROP TRIGGER IF EXISTS trigger_handle_project_code_reassignment ON projects;
CREATE TRIGGER trigger_handle_project_code_reassignment
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_project_code_reassignment();
