
-- Eliminar todas las incidencias y sus elementos relacionados
DELETE FROM incident_items;
DELETE FROM incidents;

-- Eliminar todos los comentarios de proyectos
DELETE FROM project_comments;

-- Eliminar todo el progreso de fases de proyectos
DELETE FROM project_phase_progress;

-- Eliminar todas las notificaciones
DELETE FROM notifications;

-- Liberar todos los códigos de proyecto de vuelta a estado disponible
UPDATE project_codes 
SET status = 'available', 
    project_id = NULL, 
    updated_at = now()
WHERE project_id IS NOT NULL;

-- Limpiar el schedule de producción si hay proyectos asignados
UPDATE production_schedule 
SET project_id = NULL, 
    client_name = NULL, 
    model = NULL,
    updated_at = now()
WHERE project_id IS NOT NULL;

-- Liberar todos los vehículos asignados a proyectos
UPDATE vehicles 
SET project_id = NULL, 
    updated_at = now()
WHERE project_id IS NOT NULL;

-- Eliminar todos los proyectos
DELETE FROM projects;

-- Eliminar todos los clientes
DELETE FROM clients;
