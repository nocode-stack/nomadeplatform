-- Reset de datos: Eliminar clientes y proyectos manteniendo vehículos y slots
-- Orden importante para evitar errores de foreign key

-- 1. Eliminar comentarios de proyectos
DELETE FROM "NEW_Comments";

-- 2. Eliminar ítems de incidencias
DELETE FROM "NEW_Incident_Items";

-- 3. Eliminar incidencias
DELETE FROM "NEW_Incidents";

-- 4. Eliminar contratos
DELETE FROM "NEW_Contracts";

-- 5. Eliminar ítems de presupuesto
DELETE FROM "NEW_Budget_Items";

-- 6. Eliminar presupuestos
DELETE FROM "NEW_Budget";

-- 7. Eliminar información de facturación
DELETE FROM "NEW_Billing";

-- 8. Eliminar progreso de fases de proyectos
DELETE FROM "NEW_Project_Phase_Progress";

-- 9. Limpiar asignaciones de vehículos (mantener vehículos pero quitar proyecto_id)
UPDATE "NEW_Vehicles" SET project_id = NULL WHERE project_id IS NOT NULL;

-- 10. Limpiar asignaciones de slots (mantener slots pero quitar proyecto_id)
UPDATE "NEW_Production_Schedule" SET project_id = NULL WHERE project_id IS NOT NULL;

-- 11. Eliminar proyectos
DELETE FROM "NEW_Projects";

-- 12. Eliminar clientes
DELETE FROM "NEW_Clients";

-- Verificar que las tablas están vacías
SELECT 'NEW_Clients' as tabla, COUNT(*) as registros FROM "NEW_Clients"
UNION ALL
SELECT 'NEW_Projects' as tabla, COUNT(*) as registros FROM "NEW_Projects"
UNION ALL
SELECT 'NEW_Comments' as tabla, COUNT(*) as registros FROM "NEW_Comments"
UNION ALL
SELECT 'NEW_Incidents' as tabla, COUNT(*) as registros FROM "NEW_Incidents"
UNION ALL
SELECT 'NEW_Contracts' as tabla, COUNT(*) as registros FROM "NEW_Contracts"
UNION ALL
SELECT 'NEW_Budget' as tabla, COUNT(*) as registros FROM "NEW_Budget"
UNION ALL
SELECT 'NEW_Billing' as tabla, COUNT(*) as registros FROM "NEW_Billing";

-- Verificar que vehículos y slots se mantuvieron
SELECT 'NEW_Vehicles' as tabla, COUNT(*) as registros FROM "NEW_Vehicles"
UNION ALL
SELECT 'NEW_Production_Schedule' as tabla, COUNT(*) as registros FROM "NEW_Production_Schedule";