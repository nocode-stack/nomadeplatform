-- Desasignar todos los vehículos de los proyectos "toni" y "hello" para empezar de cero
-- Esto permitirá probar la regla 1:1 desde un estado limpio

UPDATE "NEW_Vehicles" 
SET project_id = NULL 
WHERE project_id IN (
  SELECT id 
  FROM "NEW_Projects" 
  WHERE LOWER(name) IN ('toni', 'hello')
);

-- Comentario: Ahora todos los vehículos de los proyectos "toni" y "hello" están libres
-- y podrás probar la regla 1:1 asignando vehículos desde cero