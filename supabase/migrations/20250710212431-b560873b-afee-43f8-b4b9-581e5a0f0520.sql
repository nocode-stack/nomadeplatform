-- Eliminar todos los proyectos y datos relacionados

-- 1. Liberar códigos de producción asignados
UPDATE project_codes 
SET status = 'available', 
    project_id = NULL,
    updated_at = now()
WHERE status = 'assigned';

-- 2. Liberar vehículos asignados a proyectos
UPDATE vehicles 
SET project_id = NULL,
    updated_at = now()
WHERE project_id IS NOT NULL;

-- 3. Eliminar historial de fechas de entrega
DELETE FROM delivery_date_history;

-- 4. Eliminar menciones de comentarios
DELETE FROM comment_mentions 
WHERE comment_id IN (
    SELECT id FROM project_comments
);

-- 5. Eliminar notificaciones relacionadas con proyectos
DELETE FROM notifications 
WHERE project_id IS NOT NULL;

-- 6. Eliminar comentarios de proyectos
DELETE FROM project_comments;

-- 7. Eliminar progreso de fases de proyectos
DELETE FROM project_phase_progress;

-- 8. Eliminar incidencias relacionadas con proyectos
DELETE FROM incident_items 
WHERE incident_id IN (
    SELECT id FROM incidents
);
DELETE FROM incidents;

-- 9. Eliminar contratos relacionados con proyectos
DELETE FROM contracts;

-- 10. Eliminar items de presupuestos
DELETE FROM budget_items 
WHERE budget_id IN (
    SELECT id FROM budgets
);

-- 11. Eliminar PDFs de presupuestos
DELETE FROM budget_pdfs 
WHERE budget_id IN (
    SELECT id FROM budgets
);

-- 12. Eliminar presupuestos
DELETE FROM budgets;

-- 13. Limpiar slots de producción en NEW_Production_Schedule
UPDATE "NEW_Production_Schedule" 
SET project_id = NULL,
    updated_at = now()
WHERE project_id IS NOT NULL;

-- 14. Eliminar todos los proyectos de la nueva estructura
DELETE FROM "NEW_Projects";

-- 15. Eliminar todos los proyectos de la estructura antigua
DELETE FROM projects;

-- 16. Limpiar schedule de producción antigua
UPDATE production_schedule 
SET project_id = NULL,
    client_name = NULL,
    model = NULL,
    delivery_date = NULL,
    status = 'available',
    updated_at = now()
WHERE project_id IS NOT NULL;