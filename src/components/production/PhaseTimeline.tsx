
import React from 'react';
import { ProductionProject, ProductionPhase, ProjectPhase } from '../../types/production';
import { CheckCircle, Clock, AlertCircle, Pause } from 'lucide-react';

interface PhaseTimelineProps {
  project: ProductionProject;
  phases: ProductionPhase[];
}

const PhaseTimeline = ({ project, phases }: PhaseTimelineProps) => {
  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'active':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Pause className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'active':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'blocked':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getConnectorColor = (currentStatus: string, nextStatus: string) => {
    if (currentStatus === 'completed') return 'bg-green-300';
    if (currentStatus === 'active') return 'bg-orange-300';
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Roadmap de Producción - {project.code}
          </h3>
          <p className="text-sm text-gray-600">{project.code} ({project.model})</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{project.progress}%</div>
          <div className="text-sm text-gray-600">Completado</div>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center space-x-4 overflow-x-auto pb-4">
          {phases.map((phase, index) => {
            const projectPhase = project.phases.find(p => p.phaseId === phase.id);
            const status = projectPhase?.status || 'pending';
            const isLast = index === phases.length - 1;

            return (
              <React.Fragment key={phase.id}>
                <div className="flex flex-col items-center min-w-[200px]">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getPhaseColor(status)} mb-2`}>
                    {getPhaseIcon(status)}
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-medium text-sm text-gray-900 mb-1">{phase.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{phase.description}</p>
                    <div className="text-xs text-gray-500">
                      <div>{phase.estimatedDays} días estimados</div>
                      {projectPhase?.actualStartDate && (
                        <div className="mt-1">
                          Inicio: {new Date(projectPhase.actualStartDate).toLocaleDateString()}
                        </div>
                      )}
                      {projectPhase?.actualEndDate && (
                        <div>
                          Fin: {new Date(projectPhase.actualEndDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex-shrink-0 w-8 h-0.5 mt-[-20px]">
                    <div className={`w-full h-full ${getConnectorColor(status, phases[index + 1] ? project.phases.find(p => p.phaseId === phases[index + 1].id)?.status || 'pending' : 'pending')}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Pendiente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Activa</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Reworks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Bloqueada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseTimeline;
