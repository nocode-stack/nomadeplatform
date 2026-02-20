import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Car,
  Calendar,
  MapPin,
  Building,
  ExternalLink,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Settings,
  Edit,
  Trash2,
  Palette,
  AlertTriangle
} from 'lucide-react';
import { NewVehicle } from '../../types/vehicles';
import { useVehicleSpecsComparison } from '../../hooks/useVehicleSpecsComparison';
import { supabase } from '../../integrations/supabase/client';

interface NewVehicleCardProps {
  vehicle: NewVehicle;
  onAssign?: (vehicleId: string) => void;
  onEdit?: (vehicle: NewVehicle) => void;
  onDelete?: (vehicleId: string) => void;
  onViewDetail?: (vehicle: NewVehicle) => void;
}

const NewVehicleCard = ({ vehicle, onAssign, onEdit, onDelete, onViewDetail }: NewVehicleCardProps) => {
  const navigate = useNavigate();

  // Fetch primary budget for vehicle specs comparison if vehicle is assigned to a project
  const { data: primaryBudget } = useQuery({
    queryKey: ['budget', vehicle.projects?.id, 'primary'],
    queryFn: async () => {
      if (!vehicle.projects?.id) return null;

      const { data, error } = await supabase
        .from('NEW_Budget')
        .select(`
          *,
          engine_options!NEW_Budget_engine_option_id_fkey(name, power, transmission),
          exterior_color_options!NEW_Budget_exterior_color_id_fkey(name)
        `)
        .eq('project_id', vehicle.projects.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!vehicle.projects?.id
  });

  // Compare vehicle specs with budget specs if assigned to project
  const vehicleSpecs = vehicle.projects ? {
    engine: vehicle.engine,
    transmission: vehicle.transmission_type,
    exteriorColor: vehicle.exterior_color
  } : null;

  const budgetSpecs = primaryBudget ? {
    engine_options: primaryBudget.engine_options?.name,
    exterior_color: { name: primaryBudget.exterior_color_options?.name || '' },
    model_options: null
  } : null;

  const { discrepancies } = useVehicleSpecsComparison(vehicleSpecs, budgetSpecs);
  const hasDiscrepancies = vehicle.projects && discrepancies.length > 0;
  const getLocationColor = (location?: string) => {
    switch (location) {
      case 'nomade': return 'text-blue-600 bg-blue-50';
      case 'concesionario': return 'text-green-600 bg-green-50';
      case 'taller': return 'text-orange-600 bg-orange-50';
      case 'cliente': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEstadoPagoColor = (estado?: string) => {
    switch (estado) {
      case 'pagada': return 'text-green-600 bg-green-50';
      case 'no_pagada': return 'text-red-600 bg-red-50';
      case 'pendiente': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEstadoPagoIcon = (estado?: string) => {
    switch (estado) {
      case 'pagada': return <CheckCircle className="h-3 w-3" />;
      case 'no_pagada': return <AlertCircle className="h-3 w-3" />;
      case 'pendiente': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getEstadoPagoText = (estado?: string) => {
    switch (estado) {
      case 'pagada': return 'Pagado';
      case 'no_pagada': return 'No Pagado';
      case 'pendiente': return 'Pendiente';
      default: return 'Pendiente';
    }
  };

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicle.projects?.id) {
      navigate(`/proyectos/${vehicle.projects.id}`);
    }
  };

  const handleCardClick = () => {
    onViewDetail?.(vehicle);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(vehicle);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(vehicle.id);
  };

  return (
    <Card className={`hover:shadow-2xl hover:scale-[1.005] transition-all duration-300 border-l-4 cursor-pointer relative overflow-hidden group/card ${hasDiscrepancies
        ? 'border-l-destructive bg-destructive/5'
        : 'border-l-success bg-card'
      }`} onClick={handleCardClick}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover/card:bg-primary/10"></div>
      <CardContent className="p-5 relative">
        {/* Alerta de discrepancias si existen */}
        {hasDiscrepancies && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Discrepancias detectadas con presupuesto
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {discrepancies.length} diferencia{discrepancies.length > 1 ? 's' : ''} encontrada{discrepancies.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Información principal del vehículo */}
          <div className="flex-1 space-y-2">
            {/* Header con bastidor, código y matrícula */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner group-hover/card:scale-110 transition-transform">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-foreground truncate tracking-tight">
                      {vehicle.numero_bastidor}
                    </h3>
                    <Badge className="bg-primary/20 text-primary border-none font-bold text-[10px] tracking-widest uppercase">
                      {vehicle.vehicle_code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {vehicle.matricula ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border tracking-wider">
                        PLAT: {vehicle.matricula}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 italic text-[10px] font-bold tracking-wider">BASTIDOR SIN MATRICULAR</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 text-foreground border-border hover:bg-muted rounded-xl transition-all font-bold text-xs"
                    onClick={handleEditClick}
                  >
                    <Edit className="h-4 w-4 mr-2 text-primary" />
                    EDITAR
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 text-destructive border-border hover:bg-destructive/10 rounded-xl transition-all"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Detalles del vehículo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
              {vehicle.engine && (
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-bold text-foreground/80 truncate">
                    {vehicle.engine}
                  </span>
                </div>
              )}

              {vehicle.transmission_type && (
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-primary/60 flex-shrink-0" />
                  <span className="text-xs font-bold text-foreground/80 truncate">
                    {vehicle.transmission_type}
                  </span>
                </div>
              )}

              {vehicle.plazas && (
                <div className="flex items-center gap-2.5">
                  <Car className="h-4 w-4 text-primary/60 flex-shrink-0" />
                  <span className="text-xs font-bold text-foreground/80 truncate">
                    {vehicle.plazas} PLAZAS
                  </span>
                </div>
              )}

              {vehicle.exterior_color && (
                <div className="flex items-center gap-2.5">
                  <Palette className="h-4 w-4 text-primary/60 flex-shrink-0" />
                  <span className="text-xs font-bold text-foreground/80 truncate capitalize">
                    COLOR: {vehicle.exterior_color}
                  </span>
                </div>
              )}

              {vehicle.dimensions && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {vehicle.dimensions}
                  </span>
                </div>
              )}

              {vehicle.proveedor && !vehicle.engine && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate" title={vehicle.proveedor}>
                    {vehicle.proveedor}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-3 mt-1">
              {vehicle.location && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold bg-primary/5 text-primary border border-primary/20 tracking-wider">
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{vehicle.location.toUpperCase()}</span>
                </div>
              )}

              {vehicle.estado_pago && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${vehicle.estado_pago === 'pagada' ? 'bg-success/10 text-success border-success/20' :
                    vehicle.estado_pago === 'pendiente' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                  {getEstadoPagoIcon(vehicle.estado_pago)}
                  <span>{getEstadoPagoText(vehicle.estado_pago).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estado de asignación */}
          <div className="lg:w-44">
            {vehicle.projects ? (
              <button
                onClick={handleProjectClick}
                className={`w-full p-4 rounded-2xl border transition-all duration-300 cursor-pointer group reltive overflow-hidden ${hasDiscrepancies
                    ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                  }`}
                title="Ir al proyecto"
              >
                <div className="flex items-center gap-2 mb-2">
                  {hasDiscrepancies ? (
                    <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                  ) : (
                    <MapPin className="h-4 w-4 text-primary" />
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${hasDiscrepancies ? 'text-destructive' : 'text-primary'
                    }`}>
                    {hasDiscrepancies ? 'Discrepancia' : 'Producción'}
                  </span>
                  <ExternalLink className={`h-4 w-4 ml-auto opacity-40 group-hover:opacity-100 transition-opacity ${hasDiscrepancies ? 'text-destructive' : 'text-primary'
                    }`} />
                </div>
                <div className="space-y-1 text-left">
                  <p className={`text-xl font-bold transition-colors ${hasDiscrepancies
                      ? 'text-destructive'
                      : 'text-foreground'
                    }`}>
                    {vehicle.projects.code}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground line-clamp-1">
                    {vehicle.projects.name}
                  </p>
                  {vehicle.projects.clients && (
                    <div className="mt-2 text-[10px] font-bold px-2 py-0.5 bg-background rounded border border-border inline-block uppercase tracking-wider text-muted-foreground">
                      {vehicle.projects.clients.name}
                    </div>
                  )}
                </div>
                {/* Botón de desasignar */}
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[10px] font-bold h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all uppercase tracking-widest border border-transparent hover:border-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign?.(vehicle.id);
                    }}
                  >
                    Desvincular Unidad
                  </Button>
                </div>
              </button>
            ) : (
              <div className="bg-muted p-5 rounded-2xl border border-border flex flex-col items-center justify-center text-center h-full group/avail">
                <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-3 shadow-sm border border-border group-hover/avail:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Sin Asignar
                </span>
                <p className="text-xs text-muted-foreground/60 font-medium mb-4">
                  Disponible para vincular a nuevo proyecto
                </p>
                {onAssign && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[10px] font-bold h-10 rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all uppercase tracking-widest"
                    onClick={(e) => { e.stopPropagation(); onAssign(vehicle.id); }}
                  >
                    Asignar Código
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewVehicleCard;