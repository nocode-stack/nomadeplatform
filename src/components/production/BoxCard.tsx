
import React from 'react';
import { Box, ProductionProject } from '../../types/production';
import { Clock, Users, AlertTriangle, ArrowRight } from 'lucide-react';

interface BoxCardProps {
  box: Box;
  projects: ProductionProject[];
  onClick: (boxId: string) => void;
}

const BoxCard = ({ box, projects, onClick }: BoxCardProps) => {
  const getStatusColor = () => {
    switch (box.status) {
      case 'active':
        return 'border-green-200 bg-green-50';
      case 'blocked':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (box.status) {
      case 'active':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  const loadPercentage = box.capacity > 0 ? (box.currentLoad / box.capacity) * 100 : 0;

  const handleClick = () => {
    if (import.meta.env.DEV) console.log(`🔍 Box ${box.code} seleccionado:`);
    if (import.meta.env.DEV) console.log(`- Nombre: ${box.name}`);
    if (import.meta.env.DEV) console.log(`- Descripción: ${box.description}`);
    if (import.meta.env.DEV) console.log(`- Estado: ${box.status}`);
    if (import.meta.env.DEV) console.log(`- Carga: ${box.currentLoad}/${box.capacity} (${Math.round(loadPercentage)}%)`);
    if (import.meta.env.DEV) console.log(`- Proyectos en este box:`, projects);
    
    if (projects.length > 0) {
      if (import.meta.env.DEV) console.log(`- Detalles de proyectos:`);
      projects.forEach(project => {
        if (import.meta.env.DEV) console.log(`  * ${project.code} (${project.progress}% completado)`);
      });
    }
    
    onClick(box.id);
  };

  return (
    <div 
      className={`p-6 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all transform hover:scale-105 ${getStatusColor()}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-gray-900">{box.code}</h3>
          {getStatusIcon()}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 capitalize">{box.status}</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <h4 className="font-semibold text-gray-800 mb-2">{box.name}</h4>
      <p className="text-sm text-gray-600 mb-4">{box.description}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Carga actual</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {box.currentLoad}/{box.capacity}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              loadPercentage > 90 ? 'bg-red-500' : 
              loadPercentage > 70 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(loadPercentage, 100)}%` }}
          />
        </div>

        <div className="text-xs text-center text-gray-500">
          {Math.round(loadPercentage)}% de capacidad utilizada
        </div>

        {projects.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Proyectos activos</span>
            </div>
            <div className="space-y-1">
              {projects.slice(0, 2).map((project) => (
                <div key={project.id} className="text-xs bg-white px-2 py-1 rounded border flex items-center justify-between">
                  <span className="font-medium">{project.code}</span>
                  <span className="text-gray-600">{project.progress}%</span>
                </div>
              ))}
              {projects.length > 2 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{projects.length - 2} proyectos más
                </div>
              )}
            </div>
          </div>
        )}

        {projects.length === 0 && box.status === 'idle' && (
          <div className="mt-4 text-center">
            <div className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded">
              Box disponible para nuevos proyectos
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoxCard;
