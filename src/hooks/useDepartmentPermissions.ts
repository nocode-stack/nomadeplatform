import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { getDepartmentPermissions } from '@/types/auth';

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
      const userDept = profile?.department || user?.department;
      const deptConfig = getDepartmentPermissions(userDept);

      const department = userDept ? {
        id: 'temp',
        name: userDept,
        description: 'Departamento',
        is_active: true
      } : undefined;

      return {
        routes: [...deptConfig.routes],
        canEdit: deptConfig.canEdit,
        canDelete: deptConfig.canDelete,
        canValidate: deptConfig.canValidate,
        canCreateProjects: deptConfig.canCreateProjects,
        department,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};