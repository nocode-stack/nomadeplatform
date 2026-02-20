-- Add warranty status field to NEW_Vehicles table
ALTER TABLE public."NEW_Vehicles" 
ADD COLUMN warranty_status text DEFAULT 'active';

-- Add comment to explain the warranty status field
COMMENT ON COLUMN public."NEW_Vehicles".warranty_status IS 'Status of vehicle warranty: active, expired, or pending';