
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Database, FileText, Settings } from 'lucide-react';
import MigrationPanel from '../components/projects/MigrationPanel';
import { useUnifiedProjectsList } from '../hooks/useUnifiedProjects';
import { Badge } from '../components/ui/badge';

const TestMigration = () => {
  const { data: projects, isLoading } = useUnifiedProjectsList();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centro de Migración</h1>
          <p className="text-gray-600 mt-2">
            Herramientas para migrar y probar la nueva estructura de base de datos
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          Versión Beta
        </Badge>
      </div>

      <Tabs defaultValue="migration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Migración
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pruebas
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Análisis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="migration" className="space-y-6">
          <MigrationPanel />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas de Funcionalidad</CardTitle>
              <CardDescription>
                Verifica que la nueva estructura funciona correctamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Proyectos Cargados</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? '...' : projects?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600">
                    Con nueva estructura
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Fases Inicializadas</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? '...' : projects?.filter(p => p.project_phase_progress && p.project_phase_progress.length > 0).length || 0}
                  </div>
                  <p className="text-sm text-gray-600">
                    Proyectos con fases configuradas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listado de proyectos de prueba */}
          <Card>
            <CardHeader>
              <CardTitle>Proyectos con Nueva Estructura</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Cargando proyectos...</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {projects?.slice(0, 10).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{project.code}</span>
                        <span className="ml-2">{project.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {project.production_code_id ? 'Con código' : 'Sin código'}
                        </Badge>
                        <Badge className={
                          project.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          project.status === 'production' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de la Migración</CardTitle>
              <CardDescription>
                Información detallada sobre el proceso de migración y sus resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Nueva Estructura de Datos</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Clientes separados de proyectos</li>
                    <li>• Sistema maestro de fases y plantillas</li>
                    <li>• Estados calculados automáticamente</li>
                    <li>• Progreso basado en fases completadas</li>
                    <li>• Códigos de producción simplificados</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Beneficios</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Mayor coherencia en los datos</li>
                    <li>• Escalabilidad mejorada</li>
                    <li>• Mejor trazabilidad de producción</li>
                    <li>• Estados automáticos y confiables</li>
                    <li>• Separación clara de responsabilidades</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestMigration;
