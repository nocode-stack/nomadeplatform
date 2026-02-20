import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDepartmentPermissions } from '@/hooks/useDepartmentPermissions';

interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DepartmentPermission {
  id: string;
  department_id: string;
  permission_type: string;
  permission_value: string;
}

export const DepartmentManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userPermissions } = useDepartmentPermissions();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Fetch departments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch permissions for selected department
  const { data: permissions } = useQuery({
    queryKey: ['department-permissions', selectedDepartment],
    queryFn: async (): Promise<DepartmentPermission[]> => {
      if (!selectedDepartment) return [];

      const { data, error } = await supabase
        .from('department_permissions')
        .select('*')
        .eq('department_id', selectedDepartment);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDepartment,
  });

  // Toggle department active status
  const toggleDepartmentMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('departments')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Departamento actualizado correctamente' });
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar departamento',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Only show if user has admin permissions
  if (!userPermissions?.canEdit) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permisos para administrar departamentos.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (departmentsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando departamentos...</p>
        </div>
      </div>
    );
  }

  const getPermissionsByType = (type: string) => {
    return permissions?.filter(p => p.permission_type === type) || [];
  };

  const selectedDepartmentData = departments?.find(d => d.id === selectedDepartment);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Departamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments?.map((department) => (
              <div key={department.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{department.name}</h3>
                    <p className="text-sm text-muted-foreground">{department.description}</p>
                  </div>
                  <Badge variant={department.is_active ? 'default' : 'secondary'}>
                    {department.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDepartment(
                      selectedDepartment === department.id ? null : department.id
                    )}
                  >
                    {selectedDepartment === department.id ? 'Ocultar' : 'Ver Permisos'}
                  </Button>
                  <Button
                    variant={department.is_active ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleDepartmentMutation.mutate({
                      id: department.id,
                      is_active: !department.is_active
                    })}
                    disabled={toggleDepartmentMutation.isPending}
                  >
                    {department.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDepartment && selectedDepartmentData && (
        <Card>
          <CardHeader>
            <CardTitle>Permisos de {selectedDepartmentData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Route Permissions */}
              <div>
                <h4 className="font-semibold mb-2">Acceso a Rutas</h4>
                <div className="flex flex-wrap gap-2">
                  {getPermissionsByType('route_access').map((permission) => (
                    <Badge key={permission.id} variant="outline">
                      {permission.permission_value}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Permissions */}
              <div>
                <h4 className="font-semibold mb-2">Permisos de Acción</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['can_edit', 'can_delete', 'can_validate', 'can_create_projects'].map((permissionType) => {
                    const permission = permissions?.find(p => p.permission_type === permissionType);
                    const hasPermission = permission?.permission_value === 'true';

                    return (
                      <div key={permissionType} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">
                          {permissionType.replace('can_', '').replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};