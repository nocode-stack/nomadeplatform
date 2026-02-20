import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Calendar, MapPin, Camera, Clock, FileText, Tag, Phone, Mail, Car, Wrench, Shield } from 'lucide-react';
import { NewIncident } from '../../hooks/useNewIncidents';

interface NewIncidentDetailProps {
  incident: NewIncident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewIncidentDetail = ({ incident, open, onOpenChange }: NewIncidentDetailProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (statusCode?: string) => {
    switch (statusCode) {
      case 'reportada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en_revision':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'asignada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_reparacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reparada':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cerrada':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-500" />
              <span>Detalles de la Incidencia</span>
            </div>
            {/* Botón de garantía */}
            {incident.project?.vehicle?.warranty_status && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  incident.project.vehicle.warranty_status === 'active' 
                    ? 'border-green-300 text-green-700 bg-green-50' :
                  incident.project.vehicle.warranty_status === 'expired' 
                    ? 'border-red-300 text-red-700 bg-red-50' :
                    'border-yellow-300 text-yellow-700 bg-yellow-50'
                }`}
              >
                <Shield className="h-3 w-3 mr-1" />
                {incident.project.vehicle.warranty_status === 'active' ? 'Garantía Activa' :
                 incident.project.vehicle.warranty_status === 'expired' ? 'Garantía Expirada' : 'Garantía Pendiente'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Estado actual */}
          <div className="flex items-center space-x-4">
            <Badge className={`${getStatusColor(incident.status?.status_code)} font-medium border px-3 py-1`}>
              {incident.status?.label || 'Sin estado'}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Tag className="h-3 w-3 mr-1" />
              {incident.category}
            </Badge>
          </div>

          {/* Información del cliente */}
          {incident.project && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Cliente</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Nombre:</span>
                  <span className="ml-2">{incident.project.client_name}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Referencia:</span>
                  <span className="ml-2">{incident.reference_number}</span>
                </div>
              </div>
              
              {/* Información de contacto del cliente */}
              {incident.project.client && (incident.project.client.phone || incident.project.client.email) && (
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  {incident.project.client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-700 font-medium">Teléfono:</span>
                      <span className="text-blue-800">{incident.project.client.phone}</span>
                    </div>
                  )}
                  {incident.project.client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-700 font-medium">Email:</span>
                      <span className="text-blue-800">{incident.project.client.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Información del proyecto */}
          {incident.project && (() => {
            // Obtener el presupuesto primario
            const primaryBudget = incident.project.budget?.find(b => b.is_primary);
            
            return (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center space-x-2">
                  <Car className="h-4 w-4" />
                  <span>Información de Proyecto</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 font-medium">Código:</span>
                    <span className="ml-2">{incident.project.project_code}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Modelo:</span>
                    <span className="ml-2">
                      {primaryBudget?.model_option?.name || 'No especificado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Motorización y Cambio:</span>
                    <span className="ml-2">
                      {primaryBudget?.engine_option?.name || 'No especificado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Fecha de Entrega:</span>
                    <span className="ml-2">
                      {incident.project.delivery_date 
                        ? formatDate(incident.project.delivery_date) 
                        : 'Por definir'
                      }
                    </span>
                  </div>
                  {incident.project.vehicle && (
                    <div>
                      <span className="text-green-700 font-medium flex items-center space-x-1">
                        <Shield className="h-3 w-3" />
                        <span>Garantía:</span>
                      </span>
                      <span className="ml-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            incident.project.vehicle.warranty_status === 'active' 
                              ? 'border-green-300 text-green-700 bg-green-50' :
                            incident.project.vehicle.warranty_status === 'expired' 
                              ? 'border-red-300 text-red-700 bg-red-50' :
                              'border-yellow-300 text-yellow-700 bg-yellow-50'
                          }`}
                        >
                          {incident.project.vehicle.warranty_status === 'active' ? 'Activa' :
                           incident.project.vehicle.warranty_status === 'expired' ? 'Expirada' : 'Pendiente'}
                        </Badge>
                      </span>
                    </div>
                  )}
                  {primaryBudget?.exterior_color && (
                    <div>
                      <span className="text-green-700 font-medium">Color Exterior:</span>
                      <span className="ml-2">{primaryBudget.exterior_color.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}


          {/* Conceptos de reparación */}
          {incident.items && incident.items.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Conceptos de Reparación</h4>
              <div className="space-y-2">
                {incident.items.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-600">
                            <Tag className="h-3 w-3 inline mr-1" />
                            {item.category}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              item.priority === 'high' ? 'border-red-300 text-red-700' :
                              item.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-green-300 text-green-700'
                            }`}
                          >
                            {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Información de fechas y taller */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de Incidencia</span>
                </div>
                <p className="text-gray-900 ml-6">{formatDate(incident.incident_date)}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>Taller Asignado</span>
                </div>
                <p className="text-gray-900 ml-6">{incident.workshop}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Fecha de Entrada</span>
                </div>
                <p className="text-gray-900 ml-6">
                  {incident.repair_entry_date ? formatDate(incident.repair_entry_date) : 'No asignada'}
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Fecha de Salida</span>
                </div>
                <p className="text-gray-900 ml-6">
                  {incident.repair_exit_date ? formatDate(incident.repair_exit_date) : 'No asignada'}
                </p>
              </div>
            </div>
          </div>

          {/* Fotos */}
          {incident.photos && incident.photos.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Camera className="h-4 w-4" />
                <span>Fotos de la Incidencia ({incident.photos.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {incident.photos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1} de la incidencia`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información de fechas de sistema */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Creada: {formatDate(incident.created_at)}</p>
            <p>Actualizada: {formatDate(incident.updated_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewIncidentDetail;