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
  Settings,
  Zap,
  Building,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Palette,
  Ruler,
  Cog
} from 'lucide-react';
import { NewVehicle } from '../../types/vehicles';

interface NewVehiclePreviewDialogProps {
  vehicle: NewVehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewVehiclePreviewDialog = ({ vehicle, open, onOpenChange }: NewVehiclePreviewDialogProps) => {
  const navigate = useNavigate();

  if (!vehicle) return null;

  const handleProjectClick = () => {
    if (vehicle.projects?.id) {
      navigate(`/proyectos/${vehicle.projects.id}`);
      onOpenChange(false);
    }
  };

  const getLocationIcon = (location?: string) => {
    switch (location) {
      case 'nomade': return <Car className="h-4 w-4" />;
      case 'concesionario': return <Building className="h-4 w-4" />;
      case 'taller': return <MapPin className="h-4 w-4" />;
      case 'cliente': return <User className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationColor = (location?: string) => {
    switch (location) {
      case 'nomade': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'concesionario': return 'text-green-600 bg-green-50 border-green-200';
      case 'taller': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'cliente': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEstadoPagoIcon = (estado?: string) => {
    switch (estado) {
      case 'pagada': return <CheckCircle className="h-4 w-4" />;
      case 'no_pagada': return <AlertCircle className="h-4 w-4" />;
      case 'pendiente': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEstadoPagoColor = (estado?: string) => {
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
                  <label className="text-sm font-medium text-gray-600">Código de Vehículo</label>
                  <p className="text-lg font-semibold text-gray-900">{vehicle.vehicle_code}</p>
                </div>
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
                  <label className="text-sm font-medium text-gray-600">Proveedor</label>
                  <p className="text-gray-900">{vehicle.proveedor || <span className="text-gray-400 italic">No especificado</span>}</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Especificaciones Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Especificaciones Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicle.engine && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Zap className="h-5 w-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Motor</label>
                      <p className="text-gray-900 font-semibold">{vehicle.engine}</p>
                    </div>
                  </div>
                )}
                
                {vehicle.transmission_type && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Cog className="h-5 w-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Transmisión</label>
                      <p className="text-gray-900 font-semibold">{vehicle.transmission_type}</p>
                    </div>
                  </div>
                )}
                
                {vehicle.exterior_color && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Palette className="h-5 w-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Color</label>
                      <p className="text-gray-900 font-semibold capitalize">{vehicle.exterior_color}</p>
                    </div>
                  </div>
                )}
                
                {vehicle.dimensions && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Ruler className="h-5 w-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dimensiones</label>
                      <p className="text-gray-900 font-semibold">{vehicle.dimensions}</p>
                    </div>
                  </div>
                )}
                
                {vehicle.plazas && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Plazas</label>
                      <p className="text-gray-900 font-semibold">{vehicle.plazas}</p>
                    </div>
                  </div>
                )}
                
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
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${getLocationColor(vehicle.location)}`}>
                  {getLocationIcon(vehicle.location)}
                  <div>
                    <p className="font-semibold capitalize">{vehicle.location || 'No especificada'}</p>
                    <p className="text-sm opacity-75">
                      {vehicle.location === 'nomade' && 'Vehículo en ruta'}
                      {vehicle.location === 'concesionario' && 'En concesionario'}
                      {vehicle.location === 'taller' && 'En taller'}
                      {vehicle.location === 'cliente' && 'Con el cliente'}
                      {!vehicle.location && 'Ubicación no especificada'}
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
                    {vehicle.fecha_pago && vehicle.estado_pago === 'pagada' && (
                      <p className="text-sm opacity-75">
                        Pagado el {new Date(vehicle.fecha_pago).toLocaleDateString('es-ES')}
                      </p>
                    )}
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
              {vehicle.projects ? (
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">Asignado</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-emerald-900">{vehicle.projects.code}</p>
                      <p className="text-emerald-700">{vehicle.projects.name} {vehicle.projects.clients?.name && `(${vehicle.projects.clients.name})`}</p>
                      {vehicle.projects.clients && (
                        <p className="text-emerald-600 text-sm">
                          Cliente: {vehicle.projects.clients.name}
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
                    {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No disponible'}
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

export default NewVehiclePreviewDialog;