
-- Delete all project-related data first (due to foreign key constraints)
DELETE FROM project_phase_progress;
DELETE FROM project_comments;
DELETE FROM contracts;
DELETE FROM incidents;
DELETE FROM incident_items;
DELETE FROM notifications;

-- Release all project codes back to available status
UPDATE project_codes 
SET status = 'available', 
    project_id = NULL, 
    updated_at = now()
WHERE project_id IS NOT NULL;

-- Delete all projects
DELETE FROM projects;

-- Delete all clients
DELETE FROM clients;

-- Clean up production schedule if any projects were assigned
UPDATE production_schedule 
SET project_id = NULL, 
    client_name = NULL, 
    model = NULL,
    updated_at = now()
WHERE project_id IS NOT NULL;
