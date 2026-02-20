
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDepartmentPermissions } from '../../hooks/useDepartmentPermissions';
import { ROLE_PERMISSIONS } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoutes?: string[];
  requiredPermissions?: ('can_edit' | 'can_delete' | 'can_validate' | 'can_create_projects')[];
  requiredDepartment?: string;
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  requiredRoutes: _requiredRoutes,
  requiredPermissions,
  requiredDepartment,
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { data: permissions, isLoading: permissionsLoading } = useDepartmentPermissions();

  const isLoading = authLoading || permissionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check route-based permissions using ROLE_PERMISSIONS
  const currentPath = window.location.pathname;
  const roleConfig = ROLE_PERMISSIONS[user.role];

  if (roleConfig && currentPath !== '/') {
    // Normalize path: e.g. "/proyectos/123" → "/proyectos"
    const basePath = '/' + currentPath.split('/').filter(Boolean)[0];
    const allowedRoutes = roleConfig.routes as readonly string[];

    if (!allowedRoutes.includes(basePath)) {
      return <Navigate to="/" replace />;
    }
  }

  // Check specific required permissions (e.g. can_edit, can_delete)
  if (requiredPermissions && roleConfig) {
    const permMap: Record<string, boolean> = {
      can_edit: roleConfig.canEdit,
      can_delete: roleConfig.canDelete,
      can_validate: roleConfig.canValidate,
      can_create_projects: roleConfig.canCreateProjects
    };

    const hasAll = requiredPermissions.every(p => permMap[p]);
    if (!hasAll) {
      return <Navigate to="/" replace />;
    }
  }

  // Check department requirement
  if (requiredDepartment && user.department !== requiredDepartment && permissions?.department?.name !== requiredDepartment) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
