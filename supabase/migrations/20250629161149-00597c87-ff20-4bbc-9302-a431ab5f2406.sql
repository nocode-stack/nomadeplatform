
-- Remove all Nachito Martinez projects completely
DELETE FROM project_phase_progress 
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE name = 'Nachito Martinez'
);

-- Remove all project comments for Nachito Martinez projects
DELETE FROM project_comments 
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE name = 'Nachito Martinez'
);

-- Remove all contracts for Nachito Martinez projects
DELETE FROM contracts 
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE name = 'Nachito Martinez'
);

-- Remove all incidents for Nachito Martinez projects
DELETE FROM incidents 
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE name = 'Nachito Martinez'
);

-- Release any assigned project codes
UPDATE project_codes 
SET status = 'available', 
    project_id = NULL, 
    updated_at = now()
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE name = 'Nachito Martinez'
);

-- Finally, remove all Nachito Martinez projects
DELETE FROM projects 
WHERE name = 'Nachito Martinez';
