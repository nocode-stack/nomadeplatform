import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepartmentManager } from '@/components/admin/DepartmentManager';
import { UserDepartmentManager } from '@/components/admin/UserDepartmentManager';
import { DepartmentTester } from '@/components/admin/DepartmentTester';
import { useDepartmentPermissions } from '@/hooks/useDepartmentPermissions';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';

const Admin = () => {
  const { data: permissions } = useDepartmentPermissions();

  return (
    <ProtectedRoute requiredPermissions={['can_edit']}>
      <Layout title="Administración del Sistema" subtitle="Gestiona departamentos y permisos de usuarios">
        <Tabs defaultValue="tester" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tester">Probador de Permisos</TabsTrigger>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tester">
            <DepartmentTester />
          </TabsContent>
          
          <TabsContent value="departments">
            <DepartmentManager />
          </TabsContent>
          
          <TabsContent value="users">
            <UserDepartmentManager />
          </TabsContent>
        </Tabs>
      </Layout>
    </ProtectedRoute>
  );
};

export default Admin;