-- Reset completo de todos los proyectos y clientes
-- Primero limpiar referencias para evitar conflictos de foreign keys

-- Desasignar slots de proyectos
UPDATE public."NEW_Projects" SET slot_id = NULL;

-- Desasignar vehículos de proyectos  
UPDATE public."NEW_Projects" SET vehicle_id = NULL;

-- Limpiar referencias en configuración de producción
UPDATE public."NEW_Production_Settings" SET applies_from_slot_id = NULL;

-- Ahora eliminar todos los datos en orden
DELETE FROM public."NEW_Comments";
DELETE FROM public."NEW_Incident_Items";
DELETE FROM public."NEW_Incidents";
DELETE FROM public."NEW_Budget_Items";
DELETE FROM public."NEW_Budget";
DELETE FROM public."NEW_Contracts";
DELETE FROM public."NEW_Project_Phase_Progress";
DELETE FROM public."NEW_Vehicles";
DELETE FROM public."NEW_Production_Settings";
DELETE FROM public."NEW_Production_Schedule";
DELETE FROM public."NEW_Billing";
DELETE FROM public."NEW_Projects";
DELETE FROM public."NEW_Clients";
DELETE FROM public.production_schedule;