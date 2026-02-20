
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProjectStats from '../components/projects/ProjectStats';
import ProjectFilters from '../components/projects/ProjectFilters';
import ProjectAnalytics from '../components/projects/ProjectAnalytics';
import ProjectKanban from '../components/projects/ProjectKanban';
import NewProjectForm from '../components/projects/NewProjectForm';
import { useUnifiedProjectsList } from '../hooks/useUnifiedProjects';
import { ProjectFilter } from '../types/projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Eye, LayoutList, Kanban, RefreshCw, Loader2 } from 'lucide-react';

const Proyectos = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProjectFilter>({});
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Obtener proyectos consolidados
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useUnifiedProjectsList();

  // Force refresh on component mount to ensure fresh data
  useEffect(() => {
    if (import.meta.env.DEV) console.log('🔄 Component mounted, refreshing projects...');
    refetch();
  }, [refreshTrigger]);

  // Aplicar filtros
  const filteredProjects = useMemo(() => {
    // Additional frontend filter to ensure no Nachito Martinez projects
    const cleanProjects = projects.filter(project =>
      // No filter needed anymore since we removed project.name 
      project.clients?.name !== 'Nachito Martinez'
    );

    return cleanProjects.filter(project => {
      // Búsqueda por texto
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = project.code.toLowerCase().includes(searchLower) ||
          project.code.toLowerCase().includes(searchLower) ||
          (project.clients?.name || '').toLowerCase().includes(searchLower) ||
          project.model.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por tipo (prospect vs client)
      if (filters.type && filters.type.length > 0) {
        const isProspect = project.new_clients?.client_status === 'prospect';
        const projectType = isProspect ? 'prospect' : 'client';
        if (!filters.type.includes(projectType)) return false;
      }

      // Filtro por estado - Updated to use new status enum
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(project.status as any)) return false;
      }

      // Filtro por prioridad
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(project.priority as any)) return false;
      }
      return true;
    });
  }, [projects, filters]);

  // Calcular estadísticas de los proyectos filtrados
  const stats = useMemo(() => {
    const total = filteredProjects.length;
    const byStatus = filteredProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byPriority = filteredProjects.reduce((acc, project) => {
      acc[project.priority] = (acc[project.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const avgProgress = total > 0 ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / total) : 0;
    return {
      total,
      byStatus,
      byPriority,
      overdue: 0,
      withAlerts: 0,
      avgProgress
    };
  }, [filteredProjects]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type && filters.type.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.priority && filters.priority.length > 0) count++;
    if (filters.overdue) count++;
    if (filters.hasAlerts) count++;
    return count;
  }, [filters]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/proyectos/${projectId}`);
  };

  const handleNewProject = async (projectData: any) => {
    if (import.meta.env.DEV) console.log('Nuevo proyecto creado:', projectData);
    // Force refresh after creating new project
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
  };

  // Updated status colors and text to match new enum
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'production':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'reworks':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pre_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pre_production':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prospect':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'prospect': 'Prospecto',
      'pre_production': 'Pre-producción',
      'production': 'Producción',
      'reworks': 'Reworks',
      'pre_delivery': 'Pre-entrega',
      'delivered': 'Entregado'
    };
    return statusMap[status] || status;
  };

  const handleCardClick = (projectId: string) => (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/proyectos/${projectId}`);
  };

  if (error) {
    return (
      <Layout title="Error" subtitle="Ha ocurrido un error al cargar los proyectos">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Error al cargar proyectos</p>
          <p className="text-gray-500 mt-2">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Proyectos" subtitle="Control avanzado de todos los proyectos">
      <div className="pt-0 space-y-6 animate-blur-in">
        {/* Header fijo con selector de vista y nuevo proyecto */}
        <div className="sticky top-[var(--header-h)] bg-background z-10 pb-4 border-b border-border shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 !mt-0">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Proyectos</h2>
              <p className="text-muted-foreground mt-1 text-xs font-medium uppercase tracking-wider">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Cargando proyectos...
                  </span>
                ) : (
                  <span>{filteredProjects.length} de {projects.length} proyectos</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Nuevo Proyecto */}
              <NewProjectForm onProjectCreated={handleNewProject} />
            </div>
          </div>

          {/* Selector de vista */}
          <div className="flex items-center justify-center mt-4">
            <div className="inline-flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
              <Button
                onClick={() => setViewMode('list')}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 min-w-[100px] ${viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <LayoutList className="h-4 w-4" />
                <span className="font-medium">Lista</span>
              </Button>
              <Button
                onClick={() => setViewMode('kanban')}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 min-w-[100px] ${viewMode === 'kanban'
                  ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Kanban className="h-4 w-4" />
                <span className="font-medium">Kanban</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md rounded-full">
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="analytics">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {/* Filtros - Solo mostrar en vista lista */}
            {viewMode === 'list' && (
              <ProjectFilters
                filters={filters}
                onFiltersChange={setFilters}
                activeFiltersCount={activeFiltersCount}
              />
            )}

            {/* Contenido según vista seleccionada */}
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground text-lg">Cargando proyectos...</p>
              </div>
            ) : viewMode === 'kanban' ? (
              <ProjectKanban projects={filteredProjects} />
            ) : filteredProjects.length > 0 ? (
              <div className="space-y-4">
                {filteredProjects.map((project, idx) => (
                  <div
                    key={project.id}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                    onClick={handleCardClick(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 flex-1">
                        {/* Código */}
                        <div className={`${project.new_clients?.client_status === 'prospect'
                          ? 'bg-primary/10'
                          : 'bg-primary/5'
                          } rounded-xl p-4 min-w-[140px] shadow-sm`}>
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${project.new_clients?.client_status === 'prospect'
                            ? 'text-primary'
                            : 'text-primary/60'
                            }`}>
                            {project.new_clients?.client_status === 'prospect' ? 'Código Prospect' : 'Código Project'}
                          </div>
                          <div className="font-bold text-foreground text-xl">{project.code || 'Pendiente'}</div>
                        </div>

                        {/* Cliente */}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Cliente</div>
                          <div className="text-foreground font-bold text-lg truncate">{project.new_clients?.name || 'Sin cliente'}</div>
                        </div>

                        {/* Modelo */}
                        <div className="min-w-0 px-4 border-l border-border/50">
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Modelo Navette</div>
                          <div className="text-foreground font-semibold">{project.model}</div>
                        </div>

                        {/* Estado */}
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 font-medium">Estado</div>
                          <Badge className={`${getStatusColor(project.status)} font-medium border`}>
                            {project.new_clients?.client_status === 'prospect'
                              ? (project.currentPhase || getStatusText(project.status))
                              : getStatusText(project.status)
                            }
                          </Badge>
                        </div>

                        {/* Progreso */}
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 font-medium">Progreso</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${(project.progress || 0) >= 80 ? 'bg-green-500' :
                                  (project.progress || 0) >= 50 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 min-w-[35px]">
                              {project.progress || 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="ml-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectClick(project.id);
                          }}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 h-10 shadow-lg shadow-primary/20"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No se encontraron proyectos</p>
                <p className="text-gray-400 mt-2">
                  {activeFiltersCount > 0 ? 'Intenta ajustar los filtros de búsqueda' : 'Crea tu primer proyecto para empezar'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <ProjectStats stats={stats} />
          </TabsContent>

          <TabsContent value="analytics">
            <ProjectAnalytics projects={projects} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Proyectos;
