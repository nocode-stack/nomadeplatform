
-- Eliminar todas las incidencias y sus elementos relacionados
DELETE FROM incident_items;
DELETE FROM incidents;

-- Eliminar todos los comentarios de proyectos
DELETE FROM project_comments;

-- Eliminar todo el progreso de fases de proyectos
DELETE FROM project_phase_progress;

-- Eliminar todos los contratos
DELETE FROM contracts;

-- Eliminar todas las notificaciones
DELETE FROM notifications;

-- Eliminar todos los proyectos
DELETE FROM projects;

-- Eliminar todos los slots de producción
DELETE FROM production_slots;

-- Eliminar todos los clientes
DELETE FROM clients;
