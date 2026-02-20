
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  BarChart3,
  Users
} from 'lucide-react';

interface ProjectStatsProps {
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    withAlerts: number;
    avgProgress: number;
  };
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-green-500';
  if (percentage >= 70) return 'bg-lime-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};

const getProgressTextColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 70) return 'text-lime-600';
  if (percentage >= 50) return 'text-yellow-600';
  if (percentage >= 30) return 'text-orange-600';
  return 'text-red-600';
};

const ProjectStats = ({ stats }: ProjectStatsProps) => {
  const statCards = [
    {
      title: 'Total Proyectos',
      value: stats.total,
      icon: BarChart3,
      color: 'bg-blue-500',
      description: 'Proyectos activos'
    },
    {
      title: 'Progreso Promedio',
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      color: getProgressColor(stats.avgProgress),
      description: 'Avance general',
      textColor: getProgressTextColor(stats.avgProgress)
    },
    {
      title: 'Con Alertas',
      value: stats.withAlerts,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      description: 'Requieren atención'
    },
    {
      title: 'Retrasados',
      value: stats.overdue,
      icon: Clock,
      color: 'bg-red-500',
      description: 'Fuera de plazo'
    }
  ];

  const statusLabels: Record<string, string> = {
    'draft': 'Borrador',
    'confirmed': 'Confirmado',
    'pre_production': 'Pre-producción',
    'in_production': 'En Producción',
    'quality_control': 'Control Calidad',
    'packaging': 'Embalaje',
    'delivery': 'Entrega',
    'completed': 'Completado',
    'cancelled': 'Cancelado',
    'on_hold': 'En Pausa'
  };

  const priorityLabels: Record<string, string> = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'critical': 'Crítica'
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.textColor || 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status and Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {statusLabels[status] || status}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Por Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {priorityLabels[priority] || priority}
                  </span>
                  <Badge variant={getPriorityColor(priority) as any}>{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectStats;
