-- Add foreign key constraint from NEW_Production_Schedule to projects
ALTER TABLE "NEW_Production_Schedule" 
ADD CONSTRAINT "NEW_Production_Schedule_project_id_fkey" 
FOREIGN KEY ("project_id") REFERENCES "projects"("id");

-- Create index for better performance
CREATE INDEX idx_new_production_schedule_project_id ON "NEW_Production_Schedule"("project_id");

-- Add foreign key constraint from NEW_Production_Settings to NEW_Production_Schedule
ALTER TABLE "NEW_Production_Settings" 
ADD CONSTRAINT "NEW_Production_Settings_applies_from_slot_id_fkey" 
FOREIGN KEY ("applies_from_slot_id") REFERENCES "NEW_Production_Schedule"("id");