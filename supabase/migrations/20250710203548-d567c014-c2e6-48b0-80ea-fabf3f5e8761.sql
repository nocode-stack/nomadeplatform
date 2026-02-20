-- Make project_id nullable in NEW_Production_Schedule
ALTER TABLE "NEW_Production_Schedule" 
ALTER COLUMN "project_id" DROP NOT NULL;