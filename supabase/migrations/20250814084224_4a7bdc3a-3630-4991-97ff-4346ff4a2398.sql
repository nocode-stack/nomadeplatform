-- Reset completo de todos los proyectos y clientes
-- Eliminar en orden para evitar problemas de foreign keys

-- Eliminar comentarios de proyectos
DELETE FROM public."NEW_Comments";

-- Eliminar items de incidencias
DELETE FROM public."NEW_Incident_Items";

-- Eliminar incidencias
DELETE FROM public."NEW_Incidents";

-- Eliminar items de presupuestos
DELETE FROM public."NEW_Budget_Items";

-- Eliminar presupuestos
DELETE FROM public."NEW_Budget";

-- Eliminar contratos
DELETE FROM public."NEW_Contracts";

-- Eliminar progreso de fases de proyectos
DELETE FROM public."NEW_Project_Phase_Progress";

-- Eliminar vehículos
DELETE FROM public."NEW_Vehicles";

-- Eliminar cronograma de producción
DELETE FROM public."NEW_Production_Schedule";

-- Eliminar información de facturación
DELETE FROM public."NEW_Billing";

-- Eliminar proyectos
DELETE FROM public."NEW_Projects";

-- Eliminar clientes
DELETE FROM public."NEW_Clients";

-- Limpiar tabla de estado de asignaciones si existe
DELETE FROM public.project_assignments_status;

-- Reiniciar secuencias automáticas si es necesario
-- (Los códigos se generarán automáticamente al crear nuevos registros)