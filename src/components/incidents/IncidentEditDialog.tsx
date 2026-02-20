
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Trash2, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { NewIncident } from '../../hooks/useNewIncidents';
import { useUpdateIncident } from '../../hooks/useIncidentEdit';
import { useDeleteIncident } from '../../hooks/useIncidents';
import { useIncidentPhotos } from '../../hooks/useIncidentPhotos';
import { useIncidentItems } from '../../hooks/useIncidentItems';
import DeleteIncidentDialog from '../ui/DeleteIncidentDialog';
import IncidentItemsManager from './IncidentItemsManager';
import PhotoUpload from './PhotoUpload';

interface IncidentEditDialogProps {
  incident: NewIncident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IncidentEditDialog = ({ incident, open, onOpenChange }: IncidentEditDialogProps) => {
  const updateIncident = useUpdateIncident();
  const deleteIncident = useDeleteIncident();
  const { data: incidentItems = [] } = useIncidentItems(incident.id);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>(incident.photos || []);
  const [formData, setFormData] = useState({
    incident_date: incident.incident_date,
    workshop: incident.workshop,
  });

  const workshops = [
    'Nomade',
    'Caravaning Plaza',
    'Planeta Camper',
    'Al Milimetro'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reportada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'fechas_asignadas':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_reparacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminada':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reportada':
        return 'Reportada';
      case 'fechas_asignadas':
        return 'Fechas Asignadas';
      case 'en_reparacion':
        return 'En Reparación';
      case 'terminada':
        return 'Terminada';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create new description based on current incident items
      const description = incidentItems.length > 0 
        ? `Incidencia reportada con ${incidentItems.length} concepto(s): ${incidentItems.map(item => item.description).join(', ')}`
        : 'Incidencia reportada';
      
      await updateIncident.mutateAsync({
        incidentId: incident.id,
        data: {
          ...formData,
          description,
          photos: currentPhotos
        }
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIncident.mutateAsync(incident.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting incident:', error);
    }
  };

  const handlePhotosUpdated = (newPhotos: string[]) => {
    setCurrentPhotos(newPhotos);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Editar Incidencia</span>
              </div>
              <Badge className={`${getStatusColor(incident.status?.status_code)} font-medium border text-sm px-3 py-1`}>
                {getStatusText(incident.status?.status_code)}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Proyecto */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Información del Proyecto</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Proyecto:</span>
                  <span className="ml-2">{incident.project?.project_code || 'Sin código'}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Cliente:</span>
                  <span className="ml-2">{incident.project?.client_name || 'Sin cliente'}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Nombre:</span>
                  <span className="ml-2">{incident.project?.name || 'Sin nombre'}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Referencia:</span>
                  <span className="ml-2">{incident.reference_number || 'Sin referencia'}</span>
                </div>
              </div>
            </div>

            {/* Campos básicos de la incidencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="incident_date" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de la Incidencia</span>
                </Label>
                <Input
                  id="incident_date"
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workshop" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Taller Asignado</span>
                </Label>
                <Select 
                  value={formData.workshop} 
                  onValueChange={(value) => setFormData({...formData, workshop: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map((workshop) => (
                      <SelectItem key={workshop} value={workshop}>{workshop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Información de reportado */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Reportada:</span>
              </Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center text-sm text-gray-600">
                {formatDate(incident.created_at)}
              </div>
            </div>

            {/* Gestor de conceptos de reparación */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Conceptos de Reparación</Label>
                <p className="text-sm text-gray-600">Edita los conceptos específicos que necesitan reparación</p>
              </div>
              <IncidentItemsManager
                incidentId={incident.id}
                isEditing={true}
              />
            </div>

            {/* Subida de fotos */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Fotos de la Incidencia</Label>
                <p className="text-sm text-gray-600">Gestiona las fotos de la incidencia</p>
              </div>
              <PhotoUpload
                incidentId={incident.id}
                existingPhotos={currentPhotos}
                onPhotosUploaded={handlePhotosUpdated}
              />
            </div>

            {/* Fechas de Reparación - Solo información */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fechas de Reparación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Fecha de Entrada:</div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {incident.repair_entry_date ? formatDate(incident.repair_entry_date) : 'Pendiente asignación'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Fecha de Salida:</div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {incident.repair_exit_date ? formatDate(incident.repair_exit_date) : 'Pendiente asignación'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * Las fechas se gestionan desde el calendario de reparaciones
                </p>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateIncident.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {updateIncident.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>

          {/* Zona peligrosa - Eliminar incidencia */}
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">Zona Peligrosa</h4>
              <p className="text-sm text-red-600 mb-3">
                Esta acción eliminará permanentemente la incidencia y todos sus datos asociados.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Incidencia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteIncidentDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={deleteIncident.isPending}
      />
    </>
  );
};

export default IncidentEditDialog;
