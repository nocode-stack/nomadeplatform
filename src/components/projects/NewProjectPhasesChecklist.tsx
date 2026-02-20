import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useProjectPhases } from '../../hooks/useUnifiedProjects';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NewProjectPhasesChecklistProps {
  projectId: string;
}

const PhaseGroupColors = {
  prospect: 'bg-gray-100 text-gray-800',
  pre_production: 'bg-blue-100 text-blue-800',
  production: 'bg-orange-100 text-orange-800',
  reworks: 'bg-yellow-100 text-yellow-800',
  pre_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
} as const;

const PhaseGroupNames = {
  prospect: 'Prospecto',
  pre_production: 'Pre-producción',
  production: 'Producción',
  reworks: 'Reworks',
  pre_delivery: 'Pre-entrega',
  delivered: 'Entregado',
} as const;

const NewProjectPhasesChecklist = ({ projectId }: NewProjectPhasesChecklistProps) => {
  const { phases, isLoading, updatePhase, isUpdating } = useProjectPhases(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Cargando fases del proyecto...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar fases por grupo
  const phasesByGroup = phases.reduce((acc, phase) => {
    const group = phase.NEW_Project_Phase_Template?.group || 'unknown';
    if (!acc[group]) acc[group] = [];
    acc[group].push(phase);
    return acc;
  }, {} as Record<string, typeof phases>);

  const handlePhaseChange = (phaseId: string, checked: boolean) => {
    const newStatus = checked ? 'completed' : 'pending';
    updatePhase({ phaseId, status: newStatus });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Fases del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(phasesByGroup).map(([groupKey, groupPhases]) => {
          const completedCount = groupPhases.filter(p => p.status === 'completed').length;
          const totalCount = groupPhases.length;
          const isCompleted = completedCount === totalCount;

          return (
            <div key={groupKey} className="space-y-3">
              {/* Group Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={PhaseGroupColors[groupKey as keyof typeof PhaseGroupColors] || 'bg-gray-100 text-gray-800'}>
                    {PhaseGroupNames[groupKey as keyof typeof PhaseGroupNames] || groupKey}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {completedCount}/{totalCount} completadas
                  </span>
                </div>
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>

              {/* Group Phases */}
              <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                {groupPhases.map((phase) => {
                  const isPhaseCompleted = phase.status === 'completed';
                  
                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isPhaseCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isPhaseCompleted}
                          onCheckedChange={(checked) => 
                            handlePhaseChange(phase.id, checked as boolean)
                          }
                          disabled={isUpdating}
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {phase.NEW_Project_Phase_Template?.phase_name || 'Fase sin nombre'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Grupo: {phase.NEW_Project_Phase_Template?.group || 'Sin grupo'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Orden: {phase.NEW_Project_Phase_Template?.phase_order || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {phase.NEW_Project_Phase_Template?.group && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="capitalize">
                              {phase.NEW_Project_Phase_Template.group}
                            </span>
                          </div>
                        )}
                        
                        {phase.end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Completada: {new Date(phase.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {phases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No hay fases configuradas para este proyecto.</p>
            <p className="text-sm">Las fases se inicializarán automáticamente tras la migración.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewProjectPhasesChecklist;