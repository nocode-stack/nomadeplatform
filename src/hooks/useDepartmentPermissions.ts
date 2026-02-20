import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

export interface DepartmentPermission {
  id: string;
  department_id: string;
  permission_type: string;
  permission_value: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface UserPermissions {
  routes: string[];
  canEdit: boolean;
  canDelete: boolean;
  canValidate: boolean;
  canCreateProjects: boolean;
  department?: Department;
}

export const useDepartmentPermissions = () => {
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);

  return useQuery({
    queryKey: ['department-permissions', profile?.department],
    queryFn: async (): Promise<UserPermissions> => {
      const isDirection = profile?.department === 'Dirección' || user?.department === 'Dirección' || user?.role === 'ceo' || user?.role === 'cfo';

      const routes = ['/', '/intro', '/proyectos', '/vehiculos', '/planificacion-produccion', '/produccion', '/calidad', '/entregas', '/incidencias', '/ventas', '/customer', '/admin'];

      if (isDirection) {
        routes.push('/usuarios');
      }

      const department = profile?.department ? {
        id: 'temp',
        name: profile.department,
        description: 'Departamento temporal',
        is_active: true
      } : undefined;

      return {
        routes,
        canEdit: true,
        canDelete: true,
        canValidate: true,
        canCreateProjects: true,
        department,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};