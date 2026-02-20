-- Actualizar los department_id en user_profiles basándose en el nombre del departamento
UPDATE user_profiles 
SET department_id = (
  SELECT d.id 
  FROM departments d 
  WHERE d.name = user_profiles.department
)
WHERE department IS NOT NULL 
AND department_id IS NULL;