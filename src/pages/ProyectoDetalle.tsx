import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/ui/StatusBadge';
import IncidentFormDialog from '../components/incidents/IncidentFormDialog';
import IncidentCard from '../components/incidents/IncidentCard';

import ProjectComments from '../components/projects/ProjectComments';
import ContractManager from '../components/contracts/ContractManager';
import EditProjectForm from '../components/projects/EditProjectForm';
import ManualStatusChanger from '../components/projects/ManualStatusChanger';
import ProjectPhasesChecklist from '../components/projects/ProjectPhasesChecklist';
import ProjectSummary from '../components/projects/ProjectSummary';
import BudgetManager from '../components/budgets/BudgetManager';

import BillingInfoDisplay from '../components/projects/BillingInfoDisplay';
import { Calendar, User, Edit, CheckCircle, Shield, Loader2, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { useUnifiedProject } from '../hooks/useUnifiedProjects';
import { useProject } from '../hooks/useNewProjects';
import { useNewIncidentsList, NewIncident } from '../hooks/useNewIncidents';
import { getStatusText, getStatusColor, formatDate } from '../utils/projectUtils';
import { useToast } from '../hooks/use-toast';
import { useProjectTabsAccess } from '../hooks/useProjectTabsAccess';

const ProyectoDetalle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resumen'); // Cambiado a 'resumen' por defecto
  const [activeInfoTab, setActiveInfoTab] = useState('cliente');

  // Simular rol de usuario (en una aplicación real esto vendría del contexto de autenticación)
  const [userRole] = useState<string>('production'); // 'production' | 'admin' | 'user'

  // Cargar datos del proyecto usando el hook unificado
  const {
    data: project,
    isLoading,
    error,
    refetch
  } = useUnifiedProject(id || '');

  // Cargar las fases del proyecto desde projects para mostrar la fase actual
  const {
    data: newProject
  } = useProject(id || '');

  // Query adicional para obtener el presupuesto primario en tiempo real
  const { data: primaryBudget } = useQuery({
    queryKey: ['primary-budget', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('budget')
        .select(`
          *,
          engine_option:engine_options(*),
          model_option:model_options(*),
          exterior_color_option:exterior_color_options(*),
          pack:budget_packs(*)
        `)
        .eq('project_id', id)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching primary budget:', error);
        return null;
      }

      return data;
    },
    enabled: !!id,
    staleTime: 10000, // 10 seconds
  });

  // Cargar incidencias reales desde la base de datos filtradas por proyecto
  const {
    data: incidents = [],
    isLoading: incidentsLoading,
    refetch: refetchIncidents
  } = useNewIncidentsList(id);

  // Query para contar todos los comentarios de este proyecto específico usando comments
  const { data: totalCommentsCount = 0 } = useQuery({
    queryKey: ['new-comments-total-count', id],
    queryFn: async () => {
      if (!id) return 0;

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

      if (error) {
        console.error('Error fetching comments count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!id,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Filtrar solo incidencias no terminadas para el contador
  const activeIncidents = incidents.filter(i => i.status?.status_code !== 'terminada');

  // Hook para control de acceso a pestañas según estado del cliente
  const { allowedTabs, canAccessTab, getRestrictedMessage, isProspect } = useProjectTabsAccess(project);

  // Asegurar que prospects no accedan a pestañas restringidas
  useEffect(() => {
    if (isProspect && !canAccessTab(activeTab)) {
      setActiveTab('resumen'); // Redirigir a resumen si intenta acceder a pestaña restringida
    }
  }, [isProspect, activeTab, canAccessTab]);

  const handleBackToProjects = () => {
    navigate('/proyectos');
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleStatusChange = (incidentId: string, newStatus: string) => {
    // This would typically update the incident in the database
    if (import.meta.env.DEV) console.log('Updating incident status:', incidentId, newStatus);
    // For now, we'll just refetch the incidents to show updated data
    refetchIncidents();
  };

  const handleProjectUpdated = () => {
    if (import.meta.env.DEV) console.log('🔄 Proyecto actualizado - Refrescando datos...');
    // Forzar refetch inmediato del proyecto, presupuesto primario, vehículo y contratos
    refetch();
    queryClient.invalidateQueries({ queryKey: ['primary-budget', id] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['contract', id] });
    queryClient.invalidateQueries({ queryKey: ['contractStatuses', id] });
  };

  // Mutation para convertir prospect a cliente
  const convertToClientMutation = useMutation({
    mutationFn: async () => {
      if (!project.clients?.id) throw new Error('Cliente no encontrado');

      const { error } = await supabase
        .from('clients')
        .update({ client_status: 'client' })
        .eq('id', project.clients.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Cliente convertido",
        description: "El prospect se ha convertido a cliente y se ha asignado un código de proyecto.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo convertir el prospect a cliente",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <Layout title="Cargando...">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-4" />
        <span className="text-lg">Cargando proyecto...</span>
      </div>
    </Layout>;
  }

  if (error || !project) {
    return <Layout title="Error">
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">Error al cargar el proyecto</p>
        <p className="text-gray-500 mt-2">{error?.message || 'Proyecto no encontrado'}</p>
      </div>
    </Layout>;
  }

  // Usar el estado y progreso que viene directamente de la base de datos
  const currentStatus = project.status || 'creacion_cliente';
  const currentProgress = project.progress || 0;
  const statusText = getStatusText(currentStatus);
  const statusColor = getStatusColor(currentStatus);

  // Obtener la fase actual del proyecto desde las fases del nuevo sistema
  const getCurrentPhaseFromNewSystem = () => {
    if (newProject?.project_phase_progress && newProject.project_phase_progress.length > 0) {
      const inProgress = newProject.project_phase_progress.find((p: any) => p.status === 'in_progress');
      if (inProgress) {
        return inProgress.project_phase_template?.group || statusText;
      }

      const completed = newProject.project_phase_progress.filter((p: any) => p.status === 'completed');
      const pending = newProject.project_phase_progress.filter((p: any) => p.status === 'pending');

      if (pending.length > 0) {
        const nextPending = pending.sort((a: any, b: any) =>
          (a.project_phase_template?.phase_order || 0) - (b.project_phase_template?.phase_order || 0)
        )[0];
        return nextPending.project_phase_template?.group || statusText;
      }

      if (completed.length > 0) {
        const lastCompleted = completed.sort((a: any, b: any) =>
          (b.project_phase_template?.phase_order || 0) - (a.project_phase_template?.phase_order || 0)
        )[0];
        return lastCompleted.project_phase_template?.group || statusText;
      }
    }
    return statusText;
  };

  const currentPhaseText = getCurrentPhaseFromNewSystem();

  return <Layout title="Proyectos" currentPhase={currentPhaseText}>
    <div className="!mt-0 space-y-6 max-w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-0 flex-1">
          <button onClick={handleBackToDashboard} className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer">
            Dashboard
          </button>
          <span className="mx-2">›</span>
          <button onClick={handleBackToProjects} className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer">
            Proyectos
          </button>
          <span className="mx-2">›</span>
          <span className="text-blue-600 font-medium truncate">
            {project.clients?.client_status === 'prospect'
              ? (project.clients?.client_code || 'PC_25_XXX')
              : (project.code || 'PR_25_XXX')
            } ({project.clients?.name || 'Sin cliente'})
          </span>
        </div>

        <Button onClick={handleBackToProjects} variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-blue-50 border-blue-200 flex-shrink-0">
          <ArrowLeft className="h-4 w-4 text-blue-600" />
        </Button>
      </div>

      {/* Header con información actualizada del cliente - USANDO ESTADO DE LA BD */}
      <div className={`${project.clients?.client_status === 'prospect'
        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
        : 'bg-gradient-to-r from-blue-400 to-blue-500'
        } text-white rounded-lg px-4 md:px-6 py-4 overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Lado izquierdo: Tres conceptos principales en vertical */}
          <div className="flex flex-col space-y-1 min-w-0">
            <div className="text-xl lg:text-2xl font-bold truncate">
              {project.clients?.client_status === 'prospect'
                ? (project.clients?.client_code || 'PC_25_XXX')
                : (project.code || 'PR_25_XXX')
              }
            </div>
            <div className="text-lg lg:text-xl font-medium truncate">{project.clients?.name || 'Sin cliente'}</div>
            <div className="text-base lg:text-lg truncate">{project.model}</div>
          </div>

          {/* Lado derecho: Badges y información adicional */}
          <div className="flex flex-col space-y-3 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className={`${statusColor} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>{currentPhaseText}</span>
              </div>
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Garantía Activa</span>
              </div>
            </div>

            <div className="text-left lg:text-right">
              <div className="text-sm font-medium">
                {primaryBudget?.engine_option ?
                  `${primaryBudget.engine_option.power} ${primaryBudget.engine_option.transmission}` :
                  project.power || '-'} | {project.interior_color || '-'} int | {primaryBudget?.exterior_color_option?.name || project.exterior_color || '-'} ext
              </div>
              <div className={`text-xs mt-1 ${project.clients?.client_status === 'prospect'
                ? 'text-orange-100'
                : 'text-blue-100'
                }`}>
                Cliente: {project.clients?.name || 'Sin cliente'} | Email: {project.clients?.email || '-'}
              </div>
              <div className={`text-xs ${project.clients?.client_status === 'prospect'
                ? 'text-orange-100'
                : 'text-blue-100'
                }`}>
                Teléfono: {project.clients?.phone || '-'} | Creado: {formatDate(project.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[var(--header-h)] z-10 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <nav className="flex space-x-4 lg:space-x-8 px-4 lg:px-6 border-b border-gray-200 overflow-x-auto" aria-label="Tabs">
          {allowedTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 relative ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {tab.id === 'incidencias' && activeIncidents.length > 0 && canAccessTab('incidencias') && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {activeIncidents.length}
                </span>
              )}
              {tab.id === 'comentarios' && totalCommentsCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                  {totalCommentsCount}
                </span>
              )}
            </button>
          ))}

          {/* Mostrar pestañas restringidas en gris para prospects */}
          {isProspect && (
            <>
              <button
                disabled
                className="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 relative border-transparent text-gray-300 cursor-not-allowed"
                title="Disponible al convertir a cliente"
              >
                Incidencias
                <span className="ml-1 text-xs">🔒</span>
              </button>
              <button
                disabled
                className="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 relative border-transparent text-gray-300 cursor-not-allowed"
                title="Disponible al convertir a cliente"
              >
                Contratos
                <span className="ml-1 text-xs">🔒</span>
              </button>
              <button
                disabled
                className="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 relative border-transparent text-gray-300 cursor-not-allowed"
                title="Disponible al convertir a cliente"
              >
                Entrega
                <span className="ml-1 text-xs">🔒</span>
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 max-w-full">
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 min-w-0 overflow-hidden">
          {
            activeTab === 'resumen' && (
              <ProjectSummary
                project={{
                  ...project,
                  project_phase_progress: newProject?.project_phase_progress || []
                } as any}
                incidents={incidents}
              />
            )}

          {activeTab === 'informacion' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Información del Proyecto</h3>
                <EditProjectForm
                  projectData={project}
                  onProjectUpdated={() => {
                    // Refrescar los datos del proyecto
                    refetch();
                    toast({
                      title: "Proyecto actualizado",
                      description: "Los datos del proyecto se han actualizado correctamente.",
                    });
                  }}
                />
              </div>

              <Tabs value={activeInfoTab} onValueChange={setActiveInfoTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cliente">Cliente</TabsTrigger>
                  <TabsTrigger value="proyecto">Proyecto</TabsTrigger>
                  <TabsTrigger value="facturacion">Facturación</TabsTrigger>
                </TabsList>

                <TabsContent value="cliente" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Información del Cliente</h4>

                      {/* Switch para convertir prospect a cliente */}
                      {project.clients?.client_status === 'prospect' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600">Convertir a Cliente</span>
                              <Switch
                                checked={false}
                                disabled={convertToClientMutation.isPending}
                              />
                            </div>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>⚠️ Convertir Prospect a Cliente</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-3">
                                <p>
                                  <strong>Esta acción convertirá el prospect en un cliente activo y:</strong>
                                </p>
                                <ul className="list-disc pl-6 space-y-1">
                                  <li>Se asignará automáticamente un código de proyecto</li>
                                  <li>Se habilitarán todas las funcionalidades de gestión de proyectos</li>
                                  <li>Se podrán asignar vehículos y slots de producción</li>
                                  <li>Se activará la gestión completa de contratos y presupuestos</li>
                                </ul>
                                <p className="text-red-600 font-medium">
                                  ⚠️ Esta acción NO es reversible. Una vez convertido a cliente, no podrá volver a ser prospect.
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => convertToClientMutation.mutate()}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Confirmar Conversión
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Nombre completo</span>
                          <span className="font-medium text-gray-900">{project.clients?.name || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">DNI</span>
                          <span className="font-medium text-gray-900">{project.clients?.dni || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Dirección</span>
                          <span className="font-medium text-gray-900">{project.clients?.address || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Teléfono</span>
                          <span className="font-medium text-gray-900">{project.clients?.phone || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Mail</span>
                          <span className="font-medium text-gray-900">{project.clients?.email || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Fecha nacim.</span>
                          <span className="font-medium text-gray-900">{formatDate(project.clients?.birthdate)}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100 md:col-span-2">
                          <span className="text-gray-600">Comercial</span>
                          <span className="font-medium text-gray-900">{project.comercial || 'Sin asignar'}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100 md:col-span-2">
                          <span className="text-gray-600">Código Cliente</span>
                          <span className="font-medium text-gray-900">{project.clients?.client_code || project.clients?.client_code || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="proyecto" className="mt-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Especificaciones del Vehículo</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 mb-4">Especificaciones del Vehículo</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Modelo</span>
                            <span className="font-medium text-gray-900">{project.model}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Motorización</span>
                            <span className="font-medium text-gray-900">
                              {primaryBudget?.engine_option ?
                                `${primaryBudget.engine_option.power} ${primaryBudget.engine_option.transmission}` :
                                project.power || '-'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Color Mobiliario</span>
                            <span className="font-medium text-gray-900">{project.interior_color || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Color Exterior</span>
                            <span className="font-medium text-gray-900">{project.exterior_color || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Sistema Eléctrico</span>
                            <span className="font-medium text-gray-900">{project.electric_system || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Paquetes Extra</span>
                            <span className="font-medium text-gray-900">{primaryBudget?.pack?.name || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 mb-4">Información del Proyecto</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Código Proyecto</span>
                            <span className="font-medium text-gray-900">{project.code}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Estado</span>
                            <span className="font-medium text-orange-600">{statusText}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Progreso</span>
                            <span className="font-medium text-gray-900">{currentProgress}%</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Fecha Creación</span>
                            <span className="font-medium text-gray-900">{formatDate(project.created_at)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Última Actualización</span>
                            <span className="font-medium text-gray-900">{formatDate(project.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="facturacion" className="mt-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Datos de Facturación</h3>

                    <BillingInfoDisplay project={project} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === 'incidencias' && (
            canAccessTab('incidencias') ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Incidencias del Proyecto</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Gestiona las incidencias y problemas del proyecto
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <IncidentFormDialog preselectedProjectId={id} />
                  </div>
                </div>

                {incidentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Cargando incidencias...</span>
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <CheckCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">No hay incidencias registradas para este proyecto</p>
                    <p className="text-gray-400 text-sm mt-2">Las incidencias aparecerán aquí cuando se reporten</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-full">
                    {incidents.map(incident => (
                      <div key={incident.id} className="max-w-full overflow-hidden">
                        <IncidentCard
                          incident={incident}
                          onStatusChange={handleStatusChange}
                          userRole={userRole}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Funcionalidad Restringida</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {getRestrictedMessage('incidencias')}
                </p>
              </div>
            )
          )}

          {activeTab === 'presupuestos' && <BudgetManager project={project} />}

          {activeTab === 'contratos' && (
            canAccessTab('contratos') ? (
              <ContractManager project={project} />
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Funcionalidad Restringida</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {getRestrictedMessage('contratos')}
                </p>
              </div>
            )
          )}

          {activeTab === 'entrega' && (
            canAccessTab('entrega') ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Sección de entrega en desarrollo</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Funcionalidad Restringida</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {getRestrictedMessage('entrega')}
                </p>
              </div>
            )
          )}

          {activeTab === 'comentarios' && <ProjectComments projectId={id || ''} />}
        </div>

        <div className="w-full xl:w-80 space-y-4 flex-shrink-0">
          <ProjectPhasesChecklist projectId={id || ''} project={project} />
        </div>
      </div>
    </div>
  </Layout>;
};

export default ProyectoDetalle;
