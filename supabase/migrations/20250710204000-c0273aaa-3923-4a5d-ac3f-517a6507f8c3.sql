-- Drop the incorrect foreign key constraint
ALTER TABLE "NEW_Production_Settings" 
DROP CONSTRAINT IF EXISTS "new_production_settings_applies_from_slot_id_fkey";

-- Add the correct foreign key constraint pointing to NEW_Production_Schedule
ALTER TABLE "NEW_Production_Settings" 
ADD CONSTRAINT "new_production_settings_applies_from_slot_id_fkey" 
FOREIGN KEY ("applies_from_slot_id") REFERENCES "NEW_Production_Schedule"("id") ON DELETE SET NULL;