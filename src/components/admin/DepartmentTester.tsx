import React, { useState } from 'react';
import { useDepartmentPermissions } from '@/hooks/useDepartmentPermissions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
  description: string;
}

interface FeatureBlock {
  name: string;
  description: string;
  routes: string[];
  permissions: string[];
  examples: string[];
}

const FEATURE_BLOCKS: FeatureBlock[] = [
  {
    name: "Gestión de Proyectos",
    description: "Crear, editar y gestionar proyectos y prospects",
    routes: ["/proyectos"],
    permissions: ["can_edit", "can_create_projects", "can_validate"],
    examples: [
      "Crear nuevos proyectos",
      "Editar información de proyectos",
      "Validar fases de proyectos",
      "Convertir prospects a clientes"
    ]
  },
  {
    name: "Gestión de Vehículos",
    description: "Administrar inventario y asignación de vehículos",
    routes: ["/vehiculos"],
    permissions: ["can_edit", "can_validate"],
    examples: [
      "Asignar vehículos a proyectos",
      "Gestionar inventario",
      "Actualizar status de pago",
      "Editar información de vehículos"
    ]
  },
  {
    name: "Planificación de Producción",
    description: "Planificar y gestionar slots de producción",
    routes: ["/planificacion", "/produccion"],
    permissions: ["can_edit", "can_validate"],
    examples: [
      "Crear slots de producción",
      "Asignar proyectos a slots",
      "Modificar tiempos de producción",
      "Gestionar calendario de producción"
    ]
  },
  {
    name: "Gestión de Incidencias",
    description: "Crear y gestionar incidencias y reparaciones",
    routes: ["/incidencias"],
    permissions: ["can_edit"],
    examples: [
      "Crear nuevas incidencias",
      "Actualizar status de incidencias",
      "Asignar fechas de reparación",
      "Gestionar talleres"
    ]
  },
  {
    name: "Control de Calidad",
    description: "Supervisar y validar procesos de calidad",
    routes: ["/calidad"],
    permissions: ["can_validate"],
    examples: [
      "Realizar inspecciones",
      "Validar procesos",
      "Generar reportes de calidad"
    ]
  },
  {
    name: "Administración",
    description: "Gestión completa del sistema y usuarios",
    routes: ["/admin"],
    permissions: ["can_edit", "can_delete"],
    examples: [
      "Gestionar departamentos",
      "Asignar permisos",
      "Administrar usuarios"
    ]
  }
];

export const DepartmentTester = () => {
  const { data: userPermissions } = useDepartmentPermissions();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const { toast: _toast } = useToast();

  // Fetch all departments
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

  // Fetch permissions for selected department
  const { data: selectedDeptPermissions } = useQuery({
    queryKey: ['test-department-permissions', selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return null;

      const deptData = departments?.find(d => d.name === selectedDepartment);
      if (!deptData) return null;

      const { data, error } = await supabase
        .from('department_permissions')
        .select('*')
        .eq('department_id', deptData.id);

      if (error) throw error;

      // Process permissions
      const routes = data?.filter(p => p.permission_type === 'route_access').map(p => p.permission_value) || [];
      const permissions = data?.filter(p => p.permission_type !== 'route_access' && p.permission_value === 'true').map(p => p.permission_type) || [];

      return { routes, permissions };
    },
    enabled: !!selectedDepartment && !!departments,
  });

  const checkFeatureAccess = (feature: FeatureBlock, deptPermissions: { routes: string[]; permissions: string[] } | null | undefined) => {
    if (!deptPermissions) return { hasAccess: false, missingRoutes: [], missingPermissions: [] };

    const hasRoutes = feature.routes.every(route => deptPermissions.routes.includes(route));
    const hasPermissions = feature.permissions.every(perm => deptPermissions.permissions.includes(perm));

    const missingRoutes = feature.routes.filter(route => !deptPermissions.routes.includes(route));
    const missingPermissions = feature.permissions.filter(perm => !deptPermissions.permissions.includes(perm));

    return {
      hasAccess: hasRoutes && hasPermissions,
      missingRoutes,
      missingPermissions
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Probador de Permisos por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tu departamento actual:</label>
              <Badge variant="outline" className="ml-2">
                {userPermissions?.department?.name || 'Sin asignar'}
              </Badge>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Probar permisos de otro departamento:</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un departamento para probar" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name} - {dept.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDepartment && (
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades disponibles para: {selectedDepartment}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {FEATURE_BLOCKS.map((feature) => {
                const access = checkFeatureAccess(feature, selectedDeptPermissions);

                return (
                  <div key={feature.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Badge variant={access.hasAccess ? "default" : "destructive"}>
                        {access.hasAccess ? "✅ Acceso Completo" : "❌ Acceso Restringido"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {/* Rutas requeridas */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">RUTAS REQUERIDAS:</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {feature.routes.map((route) => (
                            <Badge
                              key={route}
                              variant={access.missingRoutes.includes(route) ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {route}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Permisos requeridos */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">PERMISOS REQUERIDOS:</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {feature.permissions.map((perm) => (
                            <Badge
                              key={perm}
                              variant={access.missingPermissions.includes(perm) ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {perm.replace('can_', '')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Ejemplos de funcionalidades */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">FUNCIONALIDADES:</label>
                        <ul className="text-xs text-muted-foreground mt-1 ml-4">
                          {feature.examples.map((example, idx) => (
                            <li key={idx} className="list-disc">{example}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Restricciones */}
                      {!access.hasAccess && (
                        <div className="bg-destructive/10 p-2 rounded text-xs">
                          <strong>Restricciones:</strong>
                          {access.missingRoutes.length > 0 && (
                            <div>• Sin acceso a rutas: {access.missingRoutes.join(', ')}</div>
                          )}
                          {access.missingPermissions.length > 0 && (
                            <div>• Faltan permisos: {access.missingPermissions.join(', ')}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Departamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments?.map((dept) => (
              <div key={dept.id} className="border rounded-lg p-3">
                <h4 className="font-semibold">{dept.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{dept.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDepartment(dept.name)}
                  className="w-full"
                >
                  Probar Permisos
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};