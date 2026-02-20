
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertTriangle, Database, CheckCircle, Loader2 } from 'lucide-react';
import { useProjectsMigration } from '../../hooks/useProjectsMigration';
import { useUnifiedProjectsList } from '../../hooks/useUnifiedProjects';

const MigrationPanel = () => {
  const { data: projects, isLoading } = useUnifiedProjectsList();
  const { migrateSingleProject, migrateAllProjects, isMigrating } = useProjectsMigration();

  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando información de proyectos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Análisis de proyectos que necesitan migración (basado en fases)
  const projectsNeedingMigration = projects?.filter(p => 
    !p.project_phase_progress || p.project_phase_progress.length === 0
  ) || [];
  const migratedProjects = projects?.filter(p => 
    p.project_phase_progress && p.project_phase_progress.length > 0
  ) || [];

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Database className="h-5 w-5" />
          Panel de Migración - Fases de Proyecto
        </CardTitle>
        <CardDescription>
          Inicializa las fases de proyecto para los proyectos que aún no las tienen configuradas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de la migración */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{migratedProjects.length}</div>
            <div className="text-sm text-gray-600">Con Fases Inicializadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{projectsNeedingMigration.length}</div>
            <div className="text-sm text-gray-600">Pendientes de Migrar</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{projects?.length || 0}</div>
            <div className="text-sm text-gray-600">Total de Proyectos</div>
          </div>
        </div>

        {/* Información de lo que hace la migración */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            ¿Qué hace la migración?
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Crea slots de producción con códigos únicos (N2501, N2502, etc.)</li>
            <li>• Vincula cada proyecto con su slot de producción</li>
            <li>• Inicializa las nuevas fases maestras del sistema</li>
            <li>• Recalcula el estado del proyecto basado en fases completadas</li>
            <li>• Mantiene toda la información existente intacta</li>
          </ul>
        </div>

        {/* Proyectos que necesitan migración */}
        {projectsNeedingMigration.length > 0 && (
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Proyectos Pendientes de Migrar
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {projectsNeedingMigration.slice(0, 10).map((project) => (
                <div key={project.id} className="flex items-center justify-between text-sm">
                  <span>{project.code}</span>
                  <Badge variant="outline" className="text-orange-600">
                    Pendiente
                  </Badge>
                </div>
              ))}
              {projectsNeedingMigration.length > 10 && (
                <div className="text-xs text-gray-500">
                  ... y {projectsNeedingMigration.length - 10} más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={() => migrateAllProjects()}
            disabled={isMigrating || projectsNeedingMigration.length === 0}
            className="flex-1"
          >
            {isMigrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : (
              `Migrar Todos (${projectsNeedingMigration.length})`
            )}
          </Button>
          
          {projectsNeedingMigration.length === 0 && (
            <Badge className="flex-1 flex items-center justify-center bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              ¡Migración Completada!
            </Badge>
          )}
        </div>

        {/* Warning sobre backup */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Recomendación:</strong> Aunque la migración es segura y no elimina datos existentes, 
              siempre es buena práctica hacer un backup antes de realizar cambios estructurales importantes.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MigrationPanel;
