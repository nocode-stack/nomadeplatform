
export type Department = 'Dirección' | 'Superadmin' | 'Ventas' | string;

export interface User {
  id: string;
  email: string;
  name: string;
  department?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type RoutePermissions = '/' | '/proyectos' | '/produccion' | '/calidad' | '/entregas' | '/incidencias' | '/ventas' | '/customer' | '/crm' | '/presupuestos' | '/contratos' | '/vehiculos' | '/planificacion-produccion' | '/admin' | '/usuarios' | '/intro';

interface DepartmentConfig {
  name: string;
  routes: RoutePermissions[];
  canEdit: boolean;
  canDelete: boolean;
  canValidate: boolean;
  canCreateProjects: boolean;
}

// Full access for Dirección and Superadmin
const FULL_ACCESS_ROUTES: RoutePermissions[] = [
  '/', '/proyectos', '/produccion', '/calidad', '/entregas', '/incidencias',
  '/ventas', '/customer', '/crm', '/presupuestos', '/contratos', '/vehiculos',
  '/planificacion-produccion', '/admin', '/usuarios', '/intro'
];

export const DEPARTMENT_PERMISSIONS: Record<string, DepartmentConfig> = {
  'Dirección': {
    name: 'Dirección',
    routes: FULL_ACCESS_ROUTES,
    canEdit: true,
    canDelete: true,
    canValidate: true,
    canCreateProjects: true
  },
  'Superadmin': {
    name: 'Superadmin',
    routes: FULL_ACCESS_ROUTES,
    canEdit: true,
    canDelete: true,
    canValidate: true,
    canCreateProjects: true
  },
  'Ventas': {
    name: 'Ventas',
    routes: ['/', '/crm', '/presupuestos', '/contratos', '/proyectos', '/intro'],
    canEdit: true,
    canDelete: false,
    canValidate: false,
    canCreateProjects: true
  }
};

// Default permissions for departments not explicitly listed
export const DEFAULT_DEPARTMENT_PERMISSIONS: DepartmentConfig = {
  name: 'General',
  routes: ['/', '/intro'],
  canEdit: false,
  canDelete: false,
  canValidate: false,
  canCreateProjects: false
};

export const getDepartmentPermissions = (department?: string): DepartmentConfig => {
  if (!department) return DEFAULT_DEPARTMENT_PERMISSIONS;
  return DEPARTMENT_PERMISSIONS[department] || DEFAULT_DEPARTMENT_PERMISSIONS;
};
