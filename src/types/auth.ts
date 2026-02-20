
export type UserRole = 'ceo' | 'cfo' | 'production_director' | 'customer_director' | 'marketing_director' | 'commercial' | 'admin' | 'production_manager' | 'operator' | 'quality' | 'sales' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type RoutePermissions = '/' | '/proyectos' | '/produccion' | '/calidad' | '/entregas' | '/incidencias' | '/ventas' | '/customer' | '/crm' | '/presupuestos' | '/contratos' | '/vehiculos' | '/planificacion-produccion' | '/admin' | '/usuarios' | '/intro';

export const ROLE_PERMISSIONS = {
  ceo: {
    name: 'CEO',
    routes: ['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/incidencias', '/ventas', '/customer', '/crm', '/presupuestos', '/contratos', '/vehiculos', '/planificacion-produccion', '/admin', '/usuarios', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: true,
    canValidate: true,
    canCreateProjects: true
  },
  cfo: {
    name: 'CFO',
    routes: ['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/incidencias', '/ventas', '/customer', '/crm', '/presupuestos', '/contratos', '/vehiculos', '/planificacion-produccion', '/admin', '/usuarios', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: true,
    canValidate: true,
    canCreateProjects: true
  },
  production_director: {
    name: 'Director de Producción',
    routes: ['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/vehiculos', '/planificacion-produccion', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: false,
    canValidate: true,
    canCreateProjects: true
  },
  customer_director: {
    name: 'Directora de Customer',
    routes: ['/', '/proyectos', '/incidencias', '/customer', '/crm', '/contratos', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: false,
    canValidate: true,
    canCreateProjects: false
  },
  marketing_director: {
    name: 'Directora de Marketing',
    routes: ['/', '/proyectos', '/ventas', '/customer', '/crm', '/presupuestos', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: false,
    canValidate: false,
    canCreateProjects: true
  },
  commercial: {
    name: 'Comercial',
    routes: ['/', '/proyectos', '/ventas', '/customer', '/crm', '/presupuestos', '/contratos', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: false,
    canValidate: false,
    canCreateProjects: true
  },
  admin: {
    name: 'Administrador',
    routes: ['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/incidencias', '/ventas', '/customer', '/crm', '/presupuestos', '/contratos', '/vehiculos', '/planificacion-produccion', '/admin', '/usuarios', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: true,
    canValidate: true,
    canCreateProjects: true
  },
  production_manager: {
    name: 'Director de Producción',
    routes: ['/', '/proyectos', '/produccion', '/calidad', '/entregas', '/vehiculos', '/planificacion-produccion', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: false,
    canValidate: true,
    canCreateProjects: true
  },
  operator: {
    name: 'Operario',
    routes: ['/', '/produccion', '/intro'] as RoutePermissions[],
    canEdit: false,
    canDelete: false,
    canValidate: true,
    canCreateProjects: false
  },
  quality: {
    name: 'Control de Calidad',
    routes: ['/', '/produccion', '/calidad', '/incidencias', '/intro'] as RoutePermissions[],
    canEdit: false,
    canDelete: false,
    canValidate: true,
    canCreateProjects: false
  },
  sales: {
    name: 'Comercial',
    routes: ['/', '/proyectos', '/ventas', '/customer', '/crm', '/presupuestos', '/contratos', '/intro'] as RoutePermissions[],
    canEdit: true,
    canDelete: false,
    canValidate: false,
    canCreateProjects: true
  },
  customer: {
    name: 'Atención al Cliente',
    routes: ['/', '/incidencias', '/customer', '/crm', '/intro'] as RoutePermissions[],
    canEdit: false,
    canDelete: false,
    canValidate: false,
    canCreateProjects: false
  }
} as const;
