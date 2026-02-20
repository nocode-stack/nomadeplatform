-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departments
CREATE POLICY "Users can view all departments" 
ON public.departments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage departments" 
ON public.departments 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create department_permissions table
CREATE TABLE public.department_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL,
  permission_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, permission_type, permission_value)
);

-- Enable RLS
ALTER TABLE public.department_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for department_permissions
CREATE POLICY "Users can view all department permissions" 
ON public.department_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage department permissions" 
ON public.department_permissions 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert departments based on current system
INSERT INTO public.departments (name, description) VALUES
('CEO', 'Chief Executive Officer - Full access to all areas'),
('CFO', 'Chief Financial Officer - Full access to all areas'),
('Dir. Producción', 'Director de Producción - Access to production, quality, and delivery'),
('Dir. Customer', 'Directora de Customer - Access to projects, incidents, and customer'),
('Dir. Marketing', 'Directora de Marketing - Access to projects, sales, and customer'),
('Comercial', 'Comercial - Access to projects, sales, and customer'),
('Administrador', 'Administrador - Full system access'),
('Operario', 'Operario - Production access only'),
('Control de Calidad', 'Control de Calidad - Quality and production access'),
('Atención al Cliente', 'Atención al Cliente - Incidents and customer access');

-- Insert permissions for each department
-- CEO permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/incidencias', '/ventas', '/customer']) AS route
WHERE d.name = 'CEO';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'true'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_delete', 'can_validate', 'can_create_projects']) AS permission_type
WHERE d.name = 'CEO';

-- CFO permissions (same as CEO)
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/incidencias', '/ventas', '/customer']) AS route
WHERE d.name = 'CFO';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'true'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_delete', 'can_validate', 'can_create_projects']) AS permission_type
WHERE d.name = 'CFO';

-- Dir. Producción permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/proyectos', '/produccion', '/calidad', '/entregas']) AS route
WHERE d.name = 'Dir. Producción';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'true'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_validate', 'can_create_projects']) AS permission_type
WHERE d.name = 'Dir. Producción';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'can_delete', 'false'
FROM public.departments d
WHERE d.name = 'Dir. Producción';

-- Dir. Customer permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/proyectos', '/incidencias', '/customer']) AS route
WHERE d.name = 'Dir. Customer';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'true'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_validate']) AS permission_type
WHERE d.name = 'Dir. Customer';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'false'
FROM public.departments d, unnest(ARRAY['can_delete', 'can_create_projects']) AS permission_type
WHERE d.name = 'Dir. Customer';

-- Dir. Marketing permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/proyectos', '/ventas', '/customer']) AS route
WHERE d.name = 'Dir. Marketing';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'true'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_create_projects']) AS permission_type
WHERE d.name = 'Dir. Marketing';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'false'
FROM public.departments d, unnest(ARRAY['can_delete', 'can_validate']) AS permission_type
WHERE d.name = 'Dir. Marketing';

-- Comercial permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/proyectos', '/ventas', '/customer']) AS route
WHERE d.name = 'Comercial';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'true'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_create_projects']) AS permission_type
WHERE d.name = 'Comercial';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'false'
FROM public.departments d, unnest(ARRAY['can_delete', 'can_validate']) AS permission_type
WHERE d.name = 'Comercial';

-- Administrador permissions (same as CEO)
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/incidencias', '/ventas', '/customer']) AS route
WHERE d.name = 'Administrador';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'true'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_delete', 'can_validate', 'can_create_projects']) AS permission_type
WHERE d.name = 'Administrador';

-- Operario permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', '/produccion'
FROM public.departments d
WHERE d.name = 'Operario';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'can_validate', 'true'
FROM public.departments d
WHERE d.name = 'Operario';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'false'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_delete', 'can_create_projects']) AS permission_type
WHERE d.name = 'Operario';

-- Control de Calidad permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/produccion', '/calidad']) AS route
WHERE d.name = 'Control de Calidad';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'can_validate', 'true'
FROM public.departments d
WHERE d.name = 'Control de Calidad';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'false'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_delete', 'can_create_projects']) AS permission_type
WHERE d.name = 'Control de Calidad';

-- Atención al Cliente permissions
INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, 'route_access', route
FROM public.departments d, unnest(ARRAY['/', '/incidencias', '/customer']) AS route
WHERE d.name = 'Atención al Cliente';

INSERT INTO public.department_permissions (department_id, permission_type, permission_value)
SELECT d.id, permission_type, 'false'
FROM public.departments d, unnest(ARRAY['can_edit', 'can_delete', 'can_validate', 'can_create_projects']) AS permission_type
WHERE d.name = 'Atención al Cliente';

-- Add department_id column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN department_id UUID REFERENCES public.departments(id);

-- Update existing user_profiles to link to departments
UPDATE public.user_profiles 
SET department_id = d.id 
FROM public.departments d 
WHERE user_profiles.department = d.name;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON public.departments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_department_permissions_updated_at 
    BEFORE UPDATE ON public.department_permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();