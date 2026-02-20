
import React from 'react';
import { ArrowRight, AlertTriangle, Clock, Flag } from 'lucide-react';
import { Badge } from '../ui/badge';
import ProgressRing from '../ui/ProgressRing';
import ClientStatusBadge from './ClientStatusBadge';
import { UnifiedProject } from '../../types/database';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    code: string;
    model: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'prospect' | 'pre_production' | 'production' | 'reworks' | 'pre_delivery' | 'delivered' | 'repair';
    progress: number;
    statusText: string;
    currentPhase?: string;
    priority?: string;
    alerts?: number;
    overdue?: boolean;
  };
  fullProject?: UnifiedProject;
  onClick: () => void;
  viewMode?: 'grid' | 'list';
}

const ProjectCard = ({ project, fullProject, onClick, viewMode = 'grid' }: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-slate-500 text-white';
      case 'pre_production': return 'bg-blue-500 text-white';
      case 'production': return 'bg-orange-500 text-white';
      case 'reworks': return 'bg-amber-500 text-white';
      case 'pre_delivery': return 'bg-purple-500 text-white';
      case 'delivered': return 'bg-green-500 text-white';
      case 'repair': return 'bg-red-500 text-white';
      // Legacy status handling
      case 'completed': return 'bg-green-500 text-white';
      case 'in-progress': return 'bg-orange-500 text-white';
      case 'blocked': return 'bg-red-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getWarrantyBadge = () => (
    <Badge className="bg-green-500 text-white px-3 py-1 rounded-full">
      Garantía Activa
    </Badge>
  );

  const handleCardClick = (e: React.MouseEvent) => {
    onClick();
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Header similar a la imagen */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-3xl font-bold">{project.code}</h2>
              <h3 className="text-2xl">{project.code}</h3>
              <span className="text-xl opacity-90">{project.model}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${getStatusColor(project.status)} px-4 py-2 rounded-full font-medium`}>
                {project.currentPhase || project.statusText}
              </Badge>
              {getWarrantyBadge()}
            </div>
          </div>
          <div className="mt-4 text-right">
            <p className="text-blue-100">140cv | Gris int | Gris ext | 2025 | 8675 MKJ</p>
            <p className="text-blue-100">Cliente: {project.client_name || 'Sin cliente'} | {project.client_email || project.client_phone || 'Sin contacto'}</p>
          </div>
        </div>

        {/* Indicadores adicionales */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ProgressRing percentage={project.progress} size={40} />
            <span className="text-sm text-gray-600">Progreso {project.progress}%</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {project.overdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Retrasado
              </Badge>
            )}
            
            {project.alerts && project.alerts > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {project.alerts}
              </Badge>
            )}
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header estilo tarjeta */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold">{project.code}</h3>
            <span className="text-lg">{project.code}</span>
          </div>
          {project.priority && (
            <Flag className="h-4 w-4" />
          )}
        </div>
        <p className="text-sm opacity-90">{project.model}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Status badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(project.status)} px-3 py-1 rounded-full text-sm`}>
              {project.currentPhase || project.statusText}
            </Badge>
            {/* Badge de estado del cliente */}
            {fullProject?.new_clients?.client_status && (
              <ClientStatusBadge status={fullProject.new_clients.client_status} />
            )}
          </div>
          {getWarrantyBadge()}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center">
          <ProgressRing percentage={project.progress} />
        </div>

        {/* Cliente */}
        <div className="text-center">
          <p className="text-sm text-gray-600">Cliente</p>
          <p className="font-medium text-gray-900">{project.client_name || 'Sin cliente'}</p>
          {project.client_email && (
            <p className="text-xs text-gray-500">{project.client_email}</p>
          )}
          {project.client_phone && (
            <p className="text-xs text-gray-500">{project.client_phone}</p>
          )}
        </div>

        {/* Alertas y acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex space-x-1">
            {project.overdue && (
              <Badge variant="destructive">
                <Clock className="h-3 w-3" />
              </Badge>
            )}
            
            {project.alerts && project.alerts > 0 && (
              <Badge variant="outline">
                <AlertTriangle className="h-3 w-3" />
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
