
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Settings, Save, Loader2 } from 'lucide-react';
import { UnifiedProject, ProjectStatus } from '../../types/database';
import { getStatusText, getStatusColor } from '../../utils/projectUtils';
import { useProjectStatusUpdater } from '../../hooks/useProjects';

interface ManualStatusChangerProps {
  project: UnifiedProject;
}

const ManualStatusChanger = ({ project }: ManualStatusChangerProps) => {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(project.status);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Estado local para el modo manual (sincronizado con la BD)
  const isManualMode = project.manual_status_control || false;
  
  // Hook personalizado para manejar las actualizaciones
  const { 
    updateManualStatus, 
    toggleManualMode, 
    isUpdatingStatus, 
    isTogglingMode 
  } = useProjectStatusUpdater(project.id);

  // Opciones de estado actualizadas para los 6 estados del enum
  const statusOptions: Array<{value: ProjectStatus, label: string}> = [
    { value: 'creacion_cliente', label: 'Creación de cliente' },
    { value: 'pre_production', label: 'Pre-producción' },
    { value: 'production', label: 'Producción' },
    { value: 'reworks', label: 'Reworks' },
    { value: 'pre_delivery', label: 'Pre-entrega' },
    { value: 'delivered', label: 'Entregado' }
  ];

  const handleToggleManualMode = () => {
    const newManualMode = !isManualMode;
    toggleManualMode();
  };

  const handleStatusChange = () => {
    if (!isManualMode || selectedStatus === project.status) return;
    updateManualStatus({ status: selectedStatus });
  };

  const handleStatusSelection = (value: string) => {
    setSelectedStatus(value as ProjectStatus);
  };

  const currentStatusColor = getStatusColor(project.status);
  const currentStatusText = getStatusText(project.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Control de Estado
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Estado actual:</span>
          <Badge className={`${currentStatusColor} text-white`}>
            {currentStatusText}
          </Badge>
        </div>

        {/* Control de modo manual */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="manual-mode" className="text-sm font-medium">
              Modo manual
            </Label>
            <p className="text-xs text-gray-500">
              {isManualMode 
                ? 'El estado se controla manualmente' 
                : 'El estado se actualiza automáticamente según las fases'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isTogglingMode && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="manual-mode"
              checked={isManualMode}
              onCheckedChange={handleToggleManualMode}
              disabled={isTogglingMode}
            />
          </div>
        </div>

        {/* Cambio de estado manual */}
        {isExpanded && isManualMode && (
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-sm font-medium">Cambiar estado manualmente:</Label>
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={handleStatusSelection}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleStatusChange}
                disabled={selectedStatus === project.status || isUpdatingStatus}
                size="sm"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Información adicional */}
        {isExpanded && !isManualMode && (
          <div className="pt-3 border-t">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Modo automático:</strong> El estado del proyecto se actualiza automáticamente 
                cuando se completan las fases correspondientes en el checklist.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualStatusChanger;
