-- Limpiar TODAS las asignaciones de vehículos para empezar de cero
-- Esto garantiza que podamos probar la regla 1:1 desde un estado completamente limpio

UPDATE "NEW_Vehicles" 
SET project_id = NULL 
WHERE project_id IS NOT NULL;

-- Comentario: Ahora todos los vehículos están liberados y disponibles para asignación