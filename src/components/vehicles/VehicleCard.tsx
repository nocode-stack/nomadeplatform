
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Car, 
  User, 
  Calendar, 
  MapPin, 
  Palette, 
  Zap, 
  Users, 
  Building, 
  ExternalLink,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit
} from 'lucide-react';
import { Vehicle } from '../../types/vehicles';

interface VehicleCardProps {
  vehicle: Vehicle & { projects?: { id: string; name: string; code: string; clients: { name: string } | null } | null };
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onAssign: (vehicleId: string) => void;
  onViewDetail: (vehicle: Vehicle & { projects?: { id: string; name: string; code: string; clients: { name: string } | null } | null }) => void;
}

const VehicleCard = ({ vehicle, onEdit, onDelete, onAssign, onViewDetail }: VehicleCardProps) => {
  const navigate = useNavigate();

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicle.projects?.id) {
      navigate(`/proyectos/${vehicle.projects.id}`);
    }
  };

  const handleCardClick = () => {
    onViewDetail(vehicle);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(vehicle);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(vehicle.id);
  };

  const getUbicacionColor = (ubicacion: string) => {
    switch (ubicacion) {
      case 'nomade': return 'text-blue-600 bg-blue-50';
      case 'concesionario': return 'text-green-600 bg-green-50';
      case 'taller': return 'text-orange-600 bg-orange-50';
      case 'cliente': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEstadoPagoColor = (estado: string) => {
    switch (estado) {
      case 'pagada': return 'text-green-600 bg-green-50';
      case 'no_pagada': return 'text-red-600 bg-red-50';
      case 'pendiente': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEstadoPagoIcon = (estado: string) => {
    switch (estado) {
      case 'pagada': return <CheckCircle className="h-3 w-3" />;
      case 'no_pagada': return <AlertCircle className="h-3 w-3" />;
      case 'pendiente': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getEstadoPagoText = (estado: string) => {
    switch (estado) {
      case 'pagada': return 'Pagado';
      case 'no_pagada': return 'No Pagado';
      case 'pendiente': return 'Pendiente';
      default: return 'Pendiente';
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.002] border-l-4 border-l-blue-500 cursor-pointer" onClick={handleCardClick}>
      <CardContent className="p-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Información principal del vehículo */}
          <div className="flex-1 space-y-2">
            {/* Header con bastidor, matrícula y botones de acción */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Car className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {vehicle.numero_bastidor}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {vehicle.matricula ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {vehicle.matricula}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Sin matrícula</span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={handleEditClick}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Detalles del vehículo - Grid responsivo simple con iconos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 capitalize truncate">
                  {vehicle.color_exterior}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {vehicle.motorizacion.replace('automatica', 'auto')}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {vehicle.plazas} plazas
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate" title={vehicle.proveedor}>
                  {vehicle.proveedor}
                </span>
              </div>
            </div>

            {/* Nueva fila para ubicación y estado de pago */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getUbicacionColor(vehicle.ubicacion)}`}>
                <MapPin className="h-3 w-3" />
                <span className="capitalize">{vehicle.ubicacion}</span>
              </div>
              
              <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getEstadoPagoColor(vehicle.estado_pago)}`}>
                {getEstadoPagoIcon(vehicle.estado_pago)}
                <span>Estado de Pago: {getEstadoPagoText(vehicle.estado_pago)}</span>
              </div>
            </div>
          </div>

          {/* Estado de asignación - solo esta sección con color */}
          <div className="lg:w-44">
            {vehicle.projects ? (
              <button
                onClick={handleProjectClick}
                className="w-full bg-gradient-to-br from-emerald-50 to-green-100 p-2.5 rounded-lg border border-emerald-200 hover:from-emerald-100 hover:to-green-200 transition-all duration-200 cursor-pointer group"
                title="Ir al proyecto"
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    Asignado
                  </span>
                  <ExternalLink className="h-3 w-3 text-emerald-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="text-sm font-semibold text-emerald-900 group-hover:text-emerald-700 transition-colors">
                    {vehicle.projects.code}
                  </p>
                  <p className="text-xs text-emerald-700 line-clamp-1" title={vehicle.projects.name}>
                    {vehicle.projects.name} {vehicle.projects.clients?.name && `(${vehicle.projects.clients.name})`}
                  </p>
                  {vehicle.projects.clients && (
                    <p className="text-xs text-emerald-600 font-medium">
                      {vehicle.projects.clients.name}
                    </p>
                  )}
                </div>
              </button>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Disponible
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Listo para asignar
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-7"
                  onClick={(e) => {e.stopPropagation(); onAssign(vehicle.id);}}
                >
                  Asignar proyecto
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
