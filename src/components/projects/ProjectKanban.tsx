
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Zap,
  Palette,
  Package,
  Plus,
  ChevronRight,
  Clock,
  TrendingUp
} from 'lucide-react';
import { UnifiedProject } from '../../types/database';
import { getStatusColor, getStatusText } from '../../utils/projectUtils';
import { useNavigate } from 'react-router-dom';

interface ProjectKanbanProps {
  projects: UnifiedProject[];
  onProjectClick?: (project: UnifiedProject) => void;
}

const ProjectKanban = ({ projects, onProjectClick }: ProjectKanbanProps) => {
  const navigate = useNavigate();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleExpanded = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Agrupar proyectos por estado
  const groupedProjects = projects.reduce((acc, project) => {
    const status = project.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {} as Record<string, UnifiedProject[]>);

  // Configuración de columnas - colores consistentes con la app
  const statusColumns = [
    {
      key: 'prospect',
      title: 'Prospecto',
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-300',
      icon: User
    },
    {
      key: 'pre_production',
      title: 'Pre-producción',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      icon: Clock
    },
    {
      key: 'production',
      title: 'Producción',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      icon: TrendingUp
    },
    {
      key: 'reworks',
      title: 'Reworks',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      icon: Package
    },
    {
      key: 'pre_delivery',
      title: 'Pre-entrega',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      icon: Car
    },
    {
      key: 'delivered',
      title: 'Entregado',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      icon: Package
    }
  ];

  const handleProjectClick = (project: UnifiedProject) => {
    if (onProjectClick) {
      onProjectClick(project);
    } else {
      navigate(`/proyectos/${project.id}`);
    }
  };

  return (
    <div className="h-[calc(100vh-220px)] flex flex-col bg-background/50 rounded-2xl border border-border overflow-hidden animate-fade-in-up">
      {/* Header moderno */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-card/80 border-b border-border shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4 p-4">
          {statusColumns.map((column) => {
            const columnProjects = groupedProjects[column.key] || [];
            const IconComponent = column.icon;
            const hasProjects = columnProjects.length > 0;

            return (
              <div key={column.key} className="min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-2.5 rounded-xl shadow-lg ${hasProjects ? `bg-primary` : 'bg-muted'} flex-shrink-0 transition-all duration-300`}>
                      <IconComponent className={`h-4 w-4 ${hasProjects ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-xs uppercase tracking-widest truncate">
                        {column.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                        {columnProjects.length} Unidades
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`text-[10px] font-bold px-2 rounded-full border-none transition-all duration-300 ${hasProjects ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {columnProjects.length}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4 p-4">
            {statusColumns.map((column) => {
              const columnProjects = groupedProjects[column.key] || [];
              const hasProjects = columnProjects.length > 0;

              return (
                <div key={column.key} className={`min-w-0 rounded-xl p-2 min-h-[500px] transition-all duration-300 ${hasProjects ? 'bg-muted/10' : 'bg-muted/5'
                  }`}>
                  <div className="space-y-3">
                    {columnProjects.map((project) => {
                      const isExpanded = expandedProjects.has(project.id);

                      return (
                        <Card
                          key={project.id}
                          className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-border/50 bg-card hover:border-primary/30 relative overflow-hidden"
                          onClick={() => handleProjectClick(project)}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasProjects ? 'bg-primary' : 'bg-muted'
                            }`}></div>
                          <CardHeader className="pb-2 px-3 pt-3">
                            <div className="space-y-2">
                              {/* Código del proyecto */}
                              {/* Código del proyecto */}
                              <CardTitle className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors pr-6">
                                {project.code}
                              </CardTitle>

                              {/* Cliente */}
                              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate bg-muted/30 px-2 py-1 rounded border border-border/50">
                                <User className="h-3 w-3 inline mr-2 text-primary" />
                                {project.new_clients?.name || 'Venta Libre'}
                              </div>

                              {/* Modelo */}
                              <div className="text-[11px] text-primary font-bold truncate tracking-tight uppercase">
                                {project.model}
                              </div>

                              {/* Barra de progreso */}
                              <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between items-center px-0.5">
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ejecución</span>
                                  <span className="text-[10px] font-black text-foreground">
                                    {project.progress || 0}%
                                  </span>
                                </div>
                                <Progress value={project.progress || 0} className="h-1.5 bg-muted" />
                              </div>
                            </div>

                            {/* Botón expandir */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 hover:bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(project.id);
                              }}
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform duration-300 text-primary ${isExpanded ? 'rotate-90' : ''
                                  }`}
                              />
                            </Button>
                          </CardHeader>

                          {/* Contenido expandido */}
                          {isExpanded && (
                            <CardContent className="pt-0 px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                              <div className="space-y-2 text-xs">
                                {/* Información adicional del proyecto */}
                                <div className="grid grid-cols-1 gap-1.5 pt-2">
                                  {project.power && (
                                    <div className="flex items-center gap-2 text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
                                      <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                      <span className="truncate font-bold tracking-tight">{project.power}</span>
                                    </div>
                                  )}
                                  {project.interior_color && (
                                    <div className="flex items-center gap-2 text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
                                      <Palette className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                      <span className="truncate font-bold tracking-tight">{project.interior_color}</span>
                                    </div>
                                  )}
                                  {project.pack && (
                                    <div className="flex items-center gap-2 text-gray-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                      <Package className="h-3 w-3 text-indigo-600 flex-shrink-0" />
                                      <span className="truncate">{project.pack}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Información del cliente expandida */}
                                {project.clients && (
                                  <div className="space-y-1 p-2 bg-gray-50 rounded border border-gray-200">
                                    {project.clients.phone && (
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="h-3 w-3 text-green-600 flex-shrink-0" />
                                        <span className="text-xs truncate">{project.clients.phone}</span>
                                      </div>
                                    )}
                                    {project.clients.email && (
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="h-3 w-3 text-red-600 flex-shrink-0" />
                                        <span className="text-xs truncate">{project.clients.email}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}

                    {/* Estado vacío */}
                    {columnProjects.length === 0 && (
                      <div className="text-center text-gray-400 py-12 px-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Sin proyectos</p>
                        <p className="text-xs text-gray-400 mt-1">en esta fase</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ProjectKanban;
