-- Limpiar todos los proyectos y clientes, manteniendo slots y vehículos

-- 1. Eliminar comentarios de proyectos
DELETE FROM public."NEW_Comments";

-- 2. Eliminar progreso de fases de proyectos
DELETE FROM public."NEW_Project_Phase_Progress";

-- 3. Eliminar items de incidencias
DELETE FROM public."NEW_Incident_Items" 
WHERE incident_id IN (
    SELECT id FROM public."NEW_Incidents"
);

-- 4. Eliminar incidencias
DELETE FROM public."NEW_Incidents";

-- 5. Eliminar contratos
DELETE FROM public."NEW_Contracts";

-- 6. Eliminar items de presupuestos
DELETE FROM public."NEW_Budget_Items" 
WHERE budget_id IN (
    SELECT id FROM public."NEW_Budget"
);

-- 7. Eliminar presupuestos
DELETE FROM public."NEW_Budget";

-- 8. Liberar vehículos asignados a proyectos
UPDATE public."NEW_Vehicles" 
SET project_id = NULL,
    updated_at = now()
WHERE project_id IS NOT NULL;

-- 9. Liberar slots asignados a proyectos
UPDATE public."NEW_Production_Schedule" 
SET project_id = NULL,
    updated_at = now()
WHERE project_id IS NOT NULL;

-- 10. Eliminar todos los proyectos
DELETE FROM public."NEW_Projects";

-- 11. Eliminar información de facturación
DELETE FROM public."NEW_Billing";

-- 12. Eliminar todos los clientes
DELETE FROM public."NEW_Clients";