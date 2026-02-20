
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, User, AlertCircle, CheckCircle, Wrench, Package, Eye, X } from 'lucide-react';
import { NewIncident } from '@/hooks/useNewIncidents';
import { useNewIncidentItems } from '@/hooks/useNewIncidentItems';
import { useToast } from '@/hooks/use-toast';

interface IncidentDetailProps {
  incident: NewIncident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (incidentId: string, newStatusId: string) => void;
  userRole?: string;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({ 
  incident, 
  open, 
  onOpenChange, 
  onStatusChange,
  userRole = 'user'
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { data: incidentItems, isLoading: itemsLoading } = useNewIncidentItems(incident.id);
  const { toast } = useToast();

  const getStatusColor = (statusCode?: string) => {
    switch (statusCode) {
      case 'reportada': return 'bg-red-100 text-red-800 border-red-200';
      case 'en_revision': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'asignada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_reparacion': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reparada': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cerrada': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statusCode?: string) => {
    switch (statusCode) {
      case 'reportada': return <AlertCircle className="h-4 w-4" />;
      case 'en_revision': return <AlertCircle className="h-4 w-4" />;
      case 'asignada': return <Calendar className="h-4 w-4" />;
      case 'en_reparacion': return <Wrench className="h-4 w-4" />;
      case 'reparada': return <CheckCircle className="h-4 w-4" />;
      case 'cerrada': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (statusCode?: string) => {
    return incident.status?.label || statusCode || 'Sin estado';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Mobiliario': 'bg-blue-100 text-blue-800',
      'Sistema eléctrico': 'bg-yellow-100 text-yellow-800',
      'Agua': 'bg-cyan-100 text-cyan-800',
      'Gas': 'bg-orange-100 text-orange-800',
      'Revestimiento': 'bg-purple-100 text-purple-800',
      'Vehículo': 'bg-green-100 text-green-800',
      'Filtraciones': 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Detalle de Incidencia</span>
                <Badge className={getStatusColor(incident.status?.status_code)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(incident.status?.status_code)}
                    {getStatusText(incident.status?.status_code)}
                  </div>
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información del proyecto */}
            {incident.project && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Información del Proyecto</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Código:</span> {incident.project.project_code}
                  </div>
                  <div>
                    <span className="font-medium">Cliente:</span> {incident.project.client_name || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Proyecto:</span> {incident.project.name || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Número de referencia:</span> {incident.reference_number || '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Información de la incidencia */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Información de la Incidencia</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Fecha incidencia: {new Date(incident.incident_date).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Taller: {incident.workshop}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Reportada: {new Date(incident.created_at).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              <div>
                <Label className="font-medium">Descripción:</Label>
                <p className="text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{incident.description}</p>
              </div>
            </div>

            {/* Conceptos a reparar - solo visualización */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Conceptos a Reparar</h4>
              
              {itemsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando conceptos...</p>
                </div>
              ) : incidentItems && incidentItems.length > 0 ? (
                <div className="space-y-3">
                  {incidentItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            Prioridad {getPriorityText(item.priority)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay conceptos registrados para esta incidencia</p>
                </div>
              )}
            </div>

            {/* Fechas de reparación - solo información */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Fechas de Reparación</h4>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Fecha de Entrada:</div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {incident.repair_entry_date ? new Date(incident.repair_entry_date).toLocaleDateString('es-ES') : 'Pendiente asignación'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Fecha de Salida:</div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {incident.repair_exit_date ? new Date(incident.repair_exit_date).toLocaleDateString('es-ES') : 'Pendiente asignación'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * Las fechas se gestionan desde el calendario de reparaciones
                </p>
              </div>
            </div>

            {/* Fotos */}
            {incident.photos && incident.photos.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Fotos de la Incidencia ({incident.photos.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {incident.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones de estado - permitir a todos los usuarios */}
            {onStatusChange && incident.status?.status_code !== 'cerrada' && (
              <div className="flex gap-2 pt-4 border-t">
                {incident.status?.status_code === 'asignada' && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(incident.id, 'en_reparacion')}
                  >
                    Iniciar Reparación
                  </Button>
                )}
                {incident.status?.status_code === 'en_reparacion' && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(incident.id, 'reparada')}
                  >
                    Marcar como Reparada
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para ver foto ampliada */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Foto de la Incidencia</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedPhoto}
                alt="Foto ampliada"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default IncidentDetail;
