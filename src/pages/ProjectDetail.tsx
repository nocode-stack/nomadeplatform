
import React from 'react';
import { useParams } from 'react-router-dom';
import { useUnifiedProject } from '../hooks/useUnifiedProjects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import ProjectSummary from '../components/projects/ProjectSummary';
import ProjectSpecsFromBudget from '../components/projects/ProjectSpecsFromBudget';
import ConvertProspectButton from '../components/clients/ConvertProspectButton';
import ProjectComments from '../components/projects/ProjectComments';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, error, refetch } = useUnifiedProject(id!);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-32" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error al cargar el proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              No se pudo cargar la información del proyecto. Por favor, verifica que el proyecto existe y que tienes permisos para acceder a él.
            </p>
            <div className="flex items-center space-x-4">
              <Button onClick={() => refetch()} variant="outline">
                Reintentar
              </Button>
              <Button asChild>
                <Link to="/proyectos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Proyectos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/proyectos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.code}
                </h1>
                <p className="text-gray-600 mt-1">
                  Cliente: {project.new_clients?.name}
                </p>
                {/* Debug info - mostrando toda la info del cliente */}
                <div className="text-sm text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                  <p>Client ID: {project.new_clients?.id}</p>
                  <p>Client Status: {project.new_clients?.client_status || 'undefined'}</p>
                  <p>Client Code: {project.new_clients?.client_code}</p>
                  <p>Condición botón: {project.new_clients?.client_status === 'prospect' ? 'TRUE - Debería mostrar botón' : 'FALSE - No mostrará botón'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mostrar botón de conversión solo si es prospect */}
            {project.new_clients?.client_status === 'prospect' && (
              <ConvertProspectButton 
                clientId={project.new_clients.id}
                clientName={project.new_clients.name || 'Cliente'}
                onSuccess={() => refetch()}
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="resumen" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="especificaciones">Especificaciones</TabsTrigger>
            <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen">
            <ProjectSummary project={project} incidents={[]} />
          </TabsContent>

          <TabsContent value="especificaciones">
            <ProjectSpecsFromBudget projectId={project.id} />
          </TabsContent>

          <TabsContent value="comentarios">
            <ProjectComments projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;
