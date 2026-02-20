import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Circle, Loader2, Settings, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { useProjectPhases } from '../../hooks/useNewProjects';
import { useProjectStatusUpdater } from '../../hooks/useProjectStatusUpdater';
import { PROJECT_PHASE_GROUPS, getStatusText, getStatusColor } from '../../utils/projectUtils';
import { ProjectStatus, UnifiedProject } from '../../types/database';
import { PhaseValidationDialog } from './PhaseValidationDialog';

interface ProjectPhasesChecklistProps {
  projectId: string;
  project: UnifiedProject;
}

const ProjectPhasesChecklist: React.FC<ProjectPhasesChecklistProps> = ({ projectId, project }) => {
  const { phases, isLoading, updatePhase, isUpdating } = useProjectPhases(projectId);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(project.status);
  const [isManualControlExpanded, setIsManualControlExpanded] = useState(false);
  
  // Estado local para el modo manual (sincronizado con la BD)
  const isManualMode = project.manual_status_control || false;
  
  // Hook personalizado para manejar las actualizaciones
  const { 
    updateManualStatus, 
    toggleManualMode, 
    isUpdatingStatus, 
    isTogglingMode 
  } = useProjectStatusUpdater(project.id);

  // Estado para controlar qué accordion está abierto - ahora puede ser string vacío para cerrar todos
  const [openAccordion, setOpenAccordion] = useState<string>('');

  // Estados para el diálogo de confirmación
  const [validationDialog, setValidationDialog] = useState<{
    isOpen: boolean;
    phaseId: string;
    phaseName: string;
    isCompleting: boolean;
  }>({
    isOpen: false,
    phaseId: '',
    phaseName: '',
    isCompleting: false
  });

  // Opciones de estado actualizadas para los 6 estados del enum
  const statusOptions: Array<{value: ProjectStatus, label: string}> = [
    { value: 'creacion_cliente', label: 'Creación de cliente' },
    { value: 'pre_production', label: 'Pre-producción' },
    { value: 'production', label: 'Producción' },
    { value: 'reworks', label: 'Reworks' },
    { value: 'pre_delivery', label: 'Pre-entrega' },
    { value: 'delivered', label: 'Entregado' }
  ];

  // Función para obtener las fases ordenadas correctamente
  const getSortedPhases = () => {
    return [...phases].sort((a, b) => {
      const groupOrderA = PROJECT_PHASE_GROUPS.findIndex(g => g.id === a.NEW_Project_Phase_Template?.group);
      const groupOrderB = PROJECT_PHASE_GROUPS.findIndex(g => g.id === b.NEW_Project_Phase_Template?.group);
      
      if (groupOrderA !== groupOrderB) {
        return groupOrderA - groupOrderB;
      }
      
      return (a.NEW_Project_Phase_Template?.phase_order || 0) - (b.NEW_Project_Phase_Template?.phase_order || 0);
    });
  };

  // Función para determinar si una fase puede ser marcada
  const canTogglePhase = (phaseId: string, currentStatus: string) => {
    // Si ya está completada, siempre se puede desmarcar
    if (currentStatus === 'completed') return true;

    const sortedPhases = getSortedPhases();
    const phaseIndex = sortedPhases.findIndex(p => p.id === phaseId);
    
    if (phaseIndex === -1) return false;
    
    // La primera fase siempre se puede marcar
    if (phaseIndex === 0) return true;
    
    // Para las demás fases, verificar que todas las anteriores estén completadas
    for (let i = 0; i < phaseIndex; i++) {
      if (sortedPhases[i].status !== 'completed') {
        return false;
      }
    }
    
    return true;
  };

  const handleTogglePhase = (phaseId: string, currentStatus: string, phaseName: string) => {
    // Si no puede hacer toggle, no hacer nada
    if (!canTogglePhase(phaseId, currentStatus)) {
      return;
    }

    // Si está completando una fase (currentStatus no es completed), mostrar diálogo
    if (currentStatus !== 'completed') {
      setValidationDialog({
        isOpen: true,
        phaseId,
        phaseName,
        isCompleting: true
      });
    } else {
      // Si está desmarcando, proceder directamente
      updatePhase({ phaseId, status: 'pending' });
    }
  };

  const handleConfirmPhaseValidation = () => {
    const { phaseId } = validationDialog;
    updatePhase({ phaseId, status: 'completed' });
    setValidationDialog({
      isOpen: false,
      phaseId: '',
      phaseName: '',
      isCompleting: false
    });
  };

  const handleCancelPhaseValidation = () => {
    setValidationDialog({
      isOpen: false,
      phaseId: '',
      phaseName: '',
      isCompleting: false
    });
  };

  const handleToggleManualMode = () => {
    toggleManualMode();
  };

  const handleStatusChange = () => {
    if (!isManualMode || selectedStatus === project.status) return;
    updateManualStatus({ status: selectedStatus });
  };

  const handleStatusSelection = (value: string) => {
    setSelectedStatus(value as ProjectStatus);
  };

  // Find the next incomplete phase to highlight and determine current group
  const getNextIncompletePhase = () => {
    const sortedPhases = getSortedPhases();
    return sortedPhases.find(phase => phase.status !== 'completed');
  };

  const nextPhase = getNextIncompletePhase();
  const currentGroupId = nextPhase?.NEW_Project_Phase_Template?.group || 'creacion_cliente';

  // Función para determinar si un grupo es el siguiente activo
  const getNextActiveGroup = () => {
    // Organize phases by group
    const phasesByGroup = phases.reduce((acc, phase) => {
      const group = phase.NEW_Project_Phase_Template?.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(phase);
      return acc;
    }, {} as Record<string, typeof phases>);

    // Encontrar el primer grupo que no está completamente terminado
    for (const group of PROJECT_PHASE_GROUPS) {
      const groupPhases = phasesByGroup[group.id] || [];
      const groupCompleted = groupPhases.filter(p => p.status === 'completed').length;
      const groupTotal = groupPhases.length;
      
      // Si el grupo no está completo, es el activo
      if (groupTotal > 0 && groupCompleted < groupTotal) {
        return group.id;
      }
    }
    
    return null;
  };

  const nextActiveGroupId = getNextActiveGroup();

  // Set initial accordion state when phases are loaded - ALWAYS call this useEffect
  useEffect(() => {
    if (phases.length > 0 && openAccordion === '') {
      setOpenAccordion(currentGroupId);
    }
  }, [phases.length, currentGroupId, openAccordion]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fases del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando fases...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Organize phases by group using the new structure
  const phasesByGroup = phases.reduce((acc, phase) => {
    const group = phase.NEW_Project_Phase_Template?.group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(phase);
    return acc;
  }, {} as Record<string, typeof phases>);

  // Calculate current project status based on completed phases
  const completedPhases = phases.filter(p => p.status === 'completed');
  const totalPhases = phases.length;
  const progressPercentage = totalPhases > 0 ? Math.round((completedPhases.length / totalPhases) * 100) : 0;

  // Handle accordion value change - updated to allow closing all by clicking the same one
  const handleAccordionChange = (value: string) => {
    setOpenAccordion(value === openAccordion ? '' : value);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fases del Proyecto</CardTitle>
          </div>
          
          {/* Control manual integrado */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="manual-mode" className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Control manual
              </Label>
              <div className="flex items-center gap-2">
                {isTogglingMode && <Loader2 className="h-3 w-3 animate-spin" />}
                <Switch
                  id="manual-mode"
                  checked={isManualMode}
                  onCheckedChange={handleToggleManualMode}
                  disabled={isTogglingMode}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualControlExpanded(!isManualControlExpanded)}
                  className="text-xs px-2 py-1 h-6"
                >
                  {isManualControlExpanded ? '−' : '+'}
                </Button>
              </div>
            </div>

            {isManualControlExpanded && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                {isManualMode 
                  ? 'El estado se controla manualmente. Puedes cambiarlo desde abajo.' 
                  : 'El estado se actualiza automáticamente según las fases completadas.'
                }
                
                {isManualMode && (
                  <div className="flex gap-2 mt-2">
                    <Select value={selectedStatus} onValueChange={handleStatusSelection}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleStatusChange}
                      disabled={selectedStatus === project.status || isUpdatingStatus}
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator with clean design */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progreso del Proyecto</span>
              <span className="text-sm font-bold text-primary">
                {progressPercentage}%
              </span>
            </div>
            
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{completedPhases.length} de {totalPhases} fases completadas</span>
              <span>
                {progressPercentage >= 100 ? '¡Proyecto completado!' : 
                 progressPercentage >= 80 ? 'Casi terminado' :
                 progressPercentage >= 50 ? 'En progreso' : 'Comenzando'}
              </span>
            </div>
          </div>

          {/* Accordion for Phase groups with controlled state */}
          <div className="space-y-2">
            <Accordion 
              type="single" 
              value={openAccordion} 
              onValueChange={handleAccordionChange}
              className="w-full"
            >
              {PROJECT_PHASE_GROUPS.map((group) => {
                const groupPhases = phasesByGroup[group.id] || [];
                const groupCompleted = groupPhases.filter(p => p.status === 'completed').length;
                const groupTotal = groupPhases.length;
                const isGroupComplete = groupTotal > 0 && groupCompleted === groupTotal;
                const isNextActiveGroup = nextActiveGroupId === group.id;

                return (
                  <AccordionItem key={group.id} value={group.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 rounded-t-lg data-[state=open]:rounded-b-none">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <h4 className={`font-medium text-sm ${
                            isGroupComplete 
                              ? 'text-green-600' 
                              : isNextActiveGroup 
                              ? 'text-orange-500 animate-pulse' 
                              : 'text-gray-700'
                          }`}>
                            {group.title}
                          </h4>
                          {isGroupComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        
                        <Badge 
                          variant={isGroupComplete ? 'default' : isNextActiveGroup ? 'destructive' : 'secondary'} 
                          className={`text-xs mr-4 ${
                            isNextActiveGroup ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' : ''
                          }`}
                        >
                          {groupCompleted}/{groupTotal}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-1">
                        {groupPhases.map((phase) => {
                          const isNextPhase = nextPhase?.id === phase.id;
                          const canToggle = canTogglePhase(phase.id, phase.status);
                          const isCompleted = phase.status === 'completed';
                          
                          return (
                            <div
                              key={phase.id}
                              className={`flex items-center gap-3 p-2 rounded text-xs ${
                                isCompleted
                                  ? 'bg-green-50 text-green-700'
                                  : isNextPhase
                                  ? 'bg-orange-50 text-orange-700'
                                  : canToggle
                                  ? 'bg-gray-50 text-gray-600'
                                  : 'bg-gray-50 text-gray-400'
                              }`}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-5 w-5 p-0 rounded-full flex-shrink-0 ${
                                  isCompleted
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : isNextPhase
                                    ? 'bg-orange-400 hover:bg-orange-500 text-white animate-pulse'
                                    : canToggle
                                    ? 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                onClick={() => handleTogglePhase(phase.id, phase.status, phase.NEW_Project_Phase_Template?.phase_name || '')}
                                disabled={isUpdating || !canToggle}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-2 w-2 animate-spin" />
                                ) : isCompleted ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <Circle className="h-3 w-3" />
                                )}
                              </Button>
                              
                              <span className={`flex-1 ${isCompleted ? 'line-through' : ''} ${!canToggle && !isCompleted ? 'opacity-50' : ''}`}>
                                {phase.NEW_Project_Phase_Template?.phase_name}
                              </span>

                              {!canToggle && !isCompleted && (
                                <span className="text-xs text-gray-400">
                                  Completa las fases anteriores
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </CardContent>
      </Card>

      <PhaseValidationDialog
        isOpen={validationDialog.isOpen}
        phaseName={validationDialog.phaseName}
        onConfirm={handleConfirmPhaseValidation}
        onCancel={handleCancelPhaseValidation}
      />
    </>
  );
};

export default ProjectPhasesChecklist;