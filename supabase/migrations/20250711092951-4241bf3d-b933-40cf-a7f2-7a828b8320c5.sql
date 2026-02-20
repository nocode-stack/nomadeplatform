-- Update NEW_Incident_Status to match old status values for compatibility
UPDATE public."NEW_Incident_Status" 
SET status_code = 'fechas_asignadas', label = 'Fechas Asignadas'
WHERE status_code = 'asignada';

-- Add missing status
INSERT INTO public."NEW_Incident_Status" (status_code, label, order_index) 
VALUES ('terminada', 'Terminada', 7)
ON CONFLICT (status_code) DO NOTHING;