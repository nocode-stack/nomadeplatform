import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDepartmentPermissions } from '@/hooks/useDepartmentPermissions';
import { useUsers } from '@/hooks/useUsers';

interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export const UserDepartmentManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userPermissions } = useDepartmentPermissions();
  const { data: users, isLoading: usersLoading } = useUsers();
  const [selectedUser, setSelectedUser] = useState<string>('');

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Update user department
  const updateUserDepartmentMutation = useMutation({
    mutationFn: async ({ userId, departmentName }: { userId: string; departmentName: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          department: departmentName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({ title: 'Departamento de usuario actualizado correctamente' });
      setSelectedUser('');
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar departamento',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const handleDepartmentChange = (userId: string, departmentName: string) => {
    updateUserDepartmentMutation.mutate({ userId, departmentName });
  };

  // Only show if user has admin permissions
  if (!userPermissions?.canEdit) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permisos para administrar usuarios.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (usersLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Departamentos de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline">
                    {user.department || 'Sin departamento'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedUser === user.user_id ? user.department || '' : ''}
                    onValueChange={(departmentName) => {
                      if (departmentName) {
                        handleDepartmentChange(user.user_id, departmentName);
                      }
                    }}
                    onOpenChange={(open) => {
                      if (open) {
                        setSelectedUser(user.user_id);
                      }
                    }}
                    disabled={updateUserDepartmentMutation.isPending}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((department) => (
                        <SelectItem key={department.id} value={department.name}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};