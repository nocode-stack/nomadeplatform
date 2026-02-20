
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Car, 
  MapPin, 
  CreditCard, 
  User, 
  Calendar,
  Palette,
  Zap,
  Users,
  Building,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Vehicle, NewVehicle } from '../../types/vehicles';

interface VehiclePreviewDialogProps {
  vehicle: ((Vehicle | NewVehicle) & { 
    projects?: { 
      id: string; 
      name: string; 
      code: string; 
      clients: { name: string } | null;
      NEW_Clients?: { name: string } | null;
    } | null;
    NEW_Projects?: {
      id: string;
      project_code: string;
      NEW_Clients: { name: string } | null;
    } | null;
  }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehiclePreviewDialog = ({ vehicle, open, onOpenChange }: VehiclePreviewDialogProps) => {
  const navigate = useNavigate();

  if (!vehicle) return null;

  const handleProjectClick = () => {
    const projectId = vehicle.projects?.id || vehicle.NEW_Projects?.id;
    if (projectId) {
      navigate(`/proyectos/${projectId}`);
      onOpenChange(false);
    }
  };

  const getUbicacionIcon = (ubicacion: string) => {
    switch (ubicacion) {
      case 'nomade': return <Car className="h-4 w-4" />;
      case 'concesionario': return <Building className="h-4 w-4" />;
      case 'taller': return <MapPin className="h-4 w-4" />;
      case 'cliente': return <User className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getUbicacionColor = (ubicacion: string) => {
    switch (ubicacion) {
      case 'nomade': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'concesionario': return 'text-green-600 bg-green-50 border-green-200';
      case 'taller': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'cliente': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEstadoPagoIcon = (estado: string) => {
    switch (estado) {
      case 'pagada': return <CheckCircle className="h-4 w-4" />;
      case 'no_pagada': return <AlertCircle className="h-4 w-4" />;
      case 'pendiente': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEstadoPagoColor = (estado: string) => {
    switch (estado) {
      case 'pagada': return 'text-green-600 bg-green-50 border-green-200';
      case 'no_pagada': return 'text-red-600 bg-red-50 border-red-200';
      case 'pendiente': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Car className="h-6 w-6 text-blue-600" />
            Información del Vehículo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5" />
                Detalles del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Número de Bastidor</label>
                  <p className="text-lg font-semibold text-gray-900">{vehicle.numero_bastidor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Matrícula</label>
                  <p className="text-gray-900">
                    {vehicle.matricula || <span className="text-gray-400 italic">Sin matrícula</span>}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Color Exterior</label>
                  <p className="text-gray-900 capitalize">
                    {('color_exterior' in vehicle ? vehicle.color_exterior : vehicle.exterior_color) || 'Sin especificar'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Motorización</label>
                  <p className="text-gray-900">
                    {('motorizacion' in vehicle ? vehicle.motorizacion : 
                      `${vehicle.engine || ''} ${vehicle.transmission_type || ''}`.trim()) || 'Sin especificar'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Plazas</label>
                  <p className="text-gray-900">{vehicle.plazas} plazas</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Proveedor</label>
                  <p className="text-gray-900">{vehicle.proveedor || 'Sin especificar'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado y Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${getUbicacionColor('ubicacion' in vehicle ? vehicle.ubicacion : vehicle.location || 'nomade')}`}>
                  {getUbicacionIcon('ubicacion' in vehicle ? vehicle.ubicacion : vehicle.location || 'nomade')}
                  <div>
                    <p className="font-semibold capitalize">{'ubicacion' in vehicle ? vehicle.ubicacion : vehicle.location || 'nomade'}</p>
                    <p className="text-sm opacity-75">
                      {('ubicacion' in vehicle ? vehicle.ubicacion : vehicle.location) === 'nomade' && 'Vehículo en ruta'}
                      {('ubicacion' in vehicle ? vehicle.ubicacion : vehicle.location) === 'concesionario' && 'En concesionario'}
                      {('ubicacion' in vehicle ? vehicle.ubicacion : vehicle.location) === 'taller' && 'En taller'}
                      {('ubicacion' in vehicle ? vehicle.ubicacion : vehicle.location) === 'cliente' && 'Con el cliente'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de Pago */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Estado de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${getEstadoPagoColor(vehicle.estado_pago)}`}>
                  {getEstadoPagoIcon(vehicle.estado_pago)}
                  <div>
                    <p className="font-semibold capitalize">
                      {vehicle.estado_pago === 'pagada' && 'Pagado'}
                      {vehicle.estado_pago === 'no_pagada' && 'No Pagado'}
                      {vehicle.estado_pago === 'pendiente' && 'Pendiente'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Asignación de Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(vehicle.projects || vehicle.NEW_Projects) ? (
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">Asignado</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-emerald-900">
                        {vehicle.projects?.code || vehicle.NEW_Projects?.project_code}
                      </p>
                      <p className="text-emerald-700">
                        {vehicle.projects?.name || vehicle.NEW_Projects?.project_code}
                        {(vehicle.projects?.clients?.name || vehicle.NEW_Projects?.NEW_Clients?.name) && 
                          ` (${vehicle.projects?.clients?.name || vehicle.NEW_Projects?.NEW_Clients?.name})`
                        }
                      </p>
                      {(vehicle.projects?.clients || vehicle.NEW_Projects?.NEW_Clients) && (
                        <p className="text-emerald-600 text-sm">
                          Cliente: {vehicle.projects?.clients?.name || vehicle.NEW_Projects?.NEW_Clients?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleProjectClick}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    Ver Proyecto
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 text-center">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-700">No asignado a ningún proyecto</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                      Este vehículo está disponible para asignación
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información de Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                  <p className="text-gray-900">
                    {new Date(vehicle.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Última Actualización</label>
                  <p className="text-gray-900">
                    {new Date(vehicle.updated_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehiclePreviewDialog;
