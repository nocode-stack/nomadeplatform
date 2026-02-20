-- Primero, eliminar las referencias de user_profiles que usan department_id
UPDATE user_profiles SET department_id = NULL;

-- Limpiar departamentos existentes
DELETE FROM department_permissions;
DELETE FROM departments;

-- Crear nuevos departamentos específicos
INSERT INTO departments (name, description, is_active) VALUES
('Dirección', 'Acceso total al sistema - Dirección ejecutiva', true),
('Finanzas', 'Gestión financiera y asignación de vehículos', true),
('Producción', 'Status de incidencias y planificación de producción', true),
('Ventas', 'Gestión de proyectos, prospects y status de proyectos', true),
('Customer', 'Atención al cliente, proyectos y status de incidencias', true);

-- Permisos para Dirección (acceso total)
INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route FROM departments d, 
(VALUES 
  ('/'),
  ('/dashboard'),
  ('/proyectos'),
  ('/vehiculos'),
  ('/produccion'),
  ('/planificacion'),
  ('/incidencias'),
  ('/calidad'),
  ('/admin')
) AS routes(route)
WHERE d.name = 'Dirección';

INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, perm_type, 'true' FROM departments d,
(VALUES 
  ('can_edit'),
  ('can_delete'),
  ('can_validate'),
  ('can_create_projects')
) AS perms(perm_type)
WHERE d.name = 'Dirección';

-- Permisos para Finanzas (vehículos y finanzas)
INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route FROM departments d,
(VALUES 
  ('/'),
  ('/dashboard'),
  ('/vehiculos'),
  ('/proyectos')
) AS routes(route)
WHERE d.name = 'Finanzas';

INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, perm_type, 'true' FROM departments d,
(VALUES 
  ('can_edit'),
  ('can_validate')
) AS perms(perm_type)
WHERE d.name = 'Finanzas';

-- Permisos para Producción (incidencias y planificación)
INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route FROM departments d,
(VALUES 
  ('/'),
  ('/dashboard'),
  ('/produccion'),
  ('/planificacion'),
  ('/incidencias'),
  ('/calidad')
) AS routes(route)
WHERE d.name = 'Producción';

INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, perm_type, 'true' FROM departments d,
(VALUES 
  ('can_edit'),
  ('can_validate')
) AS perms(perm_type)
WHERE d.name = 'Producción';

-- Permisos para Ventas (proyectos y prospects)
INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route FROM departments d,
(VALUES 
  ('/'),
  ('/dashboard'),
  ('/proyectos')
) AS routes(route)
WHERE d.name = 'Ventas';

INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, perm_type, 'true' FROM departments d,
(VALUES 
  ('can_edit'),
  ('can_create_projects'),
  ('can_validate')
) AS perms(perm_type)
WHERE d.name = 'Ventas';

-- Permisos para Customer (proyectos y status de incidencias)
INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route FROM departments d,
(VALUES 
  ('/'),
  ('/dashboard'),
  ('/proyectos'),
  ('/incidencias')
) AS routes(route)
WHERE d.name = 'Customer';

INSERT INTO department_permissions (department_id, permission_type, permission_value)
SELECT d.id, perm_type, 'true' FROM departments d,
(VALUES 
  ('can_edit')
) AS perms(perm_type)
WHERE d.name = 'Customer';

-- Asignar automáticamente Dirección al primer usuario para pruebas
UPDATE user_profiles 
SET department = 'Dirección'
WHERE user_id IN (
  SELECT user_id FROM user_profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);