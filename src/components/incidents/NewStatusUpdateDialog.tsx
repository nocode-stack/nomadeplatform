import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateNewIncidentStatus, useIncidentStatuses } from '../../hooks/useNewIncidents';
import { NewIncident } from '../../hooks/useNewIncidents';
import { logger } from '../../utils/logger';

interface NewStatusUpdateDialogProps {
  incident: NewIncident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewStatusUpdateDialog = ({ incident, open, onOpenChange }: NewStatusUpdateDialogProps) => {
  const { user } = useAuth();
  const updateStatus = useUpdateNewIncidentStatus();
  const { data: statuses = [] } = useIncidentStatuses();
  
  const [newStatusId, setNewStatusId] = useState(incident.status_id || '');
  const [repairEntryDate, setRepairEntryDate] = useState(incident.repair_entry_date || '');
  const [repairExitDate, setRepairExitDate] = useState(incident.repair_exit_date || '');

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.incident.statusChange(incident.id, newStatusId);
    
    try {
      await updateStatus.mutateAsync({
        incidentId: incident.id,
        statusId: newStatusId,
        repair_entry_date: repairEntryDate || undefined,
        repair_exit_date: repairExitDate || undefined,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case 'reportada':
        return 'bg-red-100 text-red-800';
      case 'en_revision':
        return 'bg-orange-100 text-orange-800';
      case 'asignada':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_reparacion':
        return 'bg-blue-100 text-blue-800';
      case 'reparada':
        return 'bg-purple-100 text-purple-800';
      case 'cerrada':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestión de Estado - Incidencia</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estado actual */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Estado actual:</p>
            <p className="font-medium">{incident.status?.label || 'Sin estado'}</p>
          </div>

          {/* Cambio de estado */}
          <div>
            <Label htmlFor="status">Nuevo Estado</Label>
            <Select value={newStatusId} onValueChange={setNewStatusId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status.status_code)}`}>
                      {status.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asignación de fechas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="repair_entry_date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Fecha de Entrada a Reparación</span>
                <span className="text-sm text-gray-500">(Opcional)</span>
              </Label>
              <Input
                id="repair_entry_date"
                type="date"
                value={repairEntryDate}
                onChange={(e) => setRepairEntryDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="repair_exit_date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Fecha de Salida de Reparación</span>
                <span className="text-sm text-gray-500">(Opcional)</span>
              </Label>
              <Input
                id="repair_exit_date"
                type="date"
                value={repairExitDate}
                onChange={(e) => setRepairExitDate(e.target.value)}
              />
            </div>
          </div>

          {/* Nota informativa */}
          {statuses.find(s => s.id === newStatusId)?.status_code === 'cerrada' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">💡 Nota:</span> Puedes marcar como cerrada sin especificar fechas. 
                Las fechas son opcionales y se pueden agregar más tarde si es necesario.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateStatus.isPending || !newStatusId}
            >
              {updateStatus.isPending ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewStatusUpdateDialog;