
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
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
  Clock,
  Save
} from 'lucide-react';
import { Vehicle } from '../../types/vehicles';
// import { useUpdateVehicle, useAssignVehicleToProject } from '../../hooks/useVehicles';
import { useUnifiedProjectsList } from '../../hooks/useUnifiedProjects';
import { toast } from 'sonner';

interface VehicleDetailDialogProps {
  vehicle: (Vehicle & { projects?: { id: string; name: string; code: string; clients: { name: string } | null } | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehicleDetailDialog = ({ vehicle, open, onOpenChange }: VehicleDetailDialogProps) => {
  const navigate = useNavigate();
  // Temporarily disabled - need to implement these hooks for NEW_Vehicles
  // const updateVehicle = useUpdateVehicle();
  // const assignVehicle = useAssignVehicleToProject();
  const { data: projects } = useUnifiedProjectsList();
  
  // Estados para todos los campos editables
  const [formData, setFormData] = useState({
    numero_bastidor: '',
    matricula: '',
    color_exterior: '',
    motorizacion: '' as '140cv manual' | '180cv automatica',
    plazas: 2 as 2 | 3,
    proveedor: '',
    ubicacion: '' as 'nomade' | 'concesionario' | 'taller' | 'cliente',
    estado_pago: '' as 'pagada' | 'no_pagada' | 'pendiente',
    project_id: '' as string | undefined
  });

  const [isSaving, setIsSaving] = useState(false);

  // Inicializar datos del formulario cuando cambie el vehículo
  useEffect(() => {
    if (vehicle) {
      setFormData({
        numero_bastidor: vehicle.numero_bastidor,
        matricula: vehicle.matricula || '',
        color_exterior: vehicle.color_exterior,
        motorizacion: vehicle.motorizacion,
        plazas: vehicle.plazas,
        proveedor: vehicle.proveedor,
        ubicacion: vehicle.ubicacion,
        estado_pago: vehicle.estado_pago,
        project_id: vehicle.project_id
      });
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleProjectClick = () => {
    if (vehicle.projects?.id) {
      navigate(`/proyectos/${vehicle.projects.id}`);
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = async () => {
    // Temporarily disabled - need to implement vehicle update hooks for NEW_Vehicles
    toast.error('Función temporalmente deshabilitada - necesita implementación para NEW_Vehicles');
    setIsSaving(false);
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
            Editar Vehículo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Principal - Editable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_bastidor">Número de Bastidor</Label>
                  <Input
                    id="numero_bastidor"
                    value={formData.numero_bastidor}
                    onChange={(e) => handleInputChange('numero_bastidor', e.target.value)}
                    className="font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => handleInputChange('matricula', e.target.value)}
                    placeholder="Sin matrícula"
                  />
                </div>
                <div>
                  <Label htmlFor="color_exterior">Color Exterior</Label>
                  <Input
                    id="color_exterior"
                    value={formData.color_exterior}
                    onChange={(e) => handleInputChange('color_exterior', e.target.value)}
                    className="capitalize"
                  />
                </div>
                <div>
                  <Label htmlFor="motorizacion">Motorización</Label>
                  <Select value={formData.motorizacion} onValueChange={(value) => handleInputChange('motorizacion', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="140cv manual">140cv Manual</SelectItem>
                      <SelectItem value="180cv automatica">180cv Automática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plazas">Plazas</Label>
                  <Select value={formData.plazas.toString()} onValueChange={(value) => handleInputChange('plazas', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 plazas</SelectItem>
                      <SelectItem value="3">3 plazas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    value={formData.proveedor}
                    onChange={(e) => handleInputChange('proveedor', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado y Ubicación - Editables directamente */}
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
                <div className={`flex items-center justify-between p-4 rounded-lg border ${getUbicacionColor(formData.ubicacion)} mb-3`}>
                  <div className="flex items-center gap-3">
                    {getUbicacionIcon(formData.ubicacion)}
                    <div>
                      <p className="font-semibold capitalize">{formData.ubicacion}</p>
                      <p className="text-sm opacity-75">
                        {formData.ubicacion === 'nomade' && 'Vehículo en ruta'}
                        {formData.ubicacion === 'concesionario' && 'En concesionario'}
                        {formData.ubicacion === 'taller' && 'En taller'}
                        {formData.ubicacion === 'cliente' && 'Con el cliente'}
                      </p>
                    </div>
                  </div>
                </div>
                <Label htmlFor="ubicacion">Cambiar ubicación</Label>
                <Select value={formData.ubicacion} onValueChange={(value) => handleInputChange('ubicacion', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nomade">Nómade</SelectItem>
                    <SelectItem value="concesionario">Concesionario</SelectItem>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
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
                <div className={`flex items-center justify-between p-4 rounded-lg border ${getEstadoPagoColor(formData.estado_pago)} mb-3`}>
                  <div className="flex items-center gap-3">
                    {getEstadoPagoIcon(formData.estado_pago)}
                    <div>
                      <p className="font-semibold capitalize">
                        {formData.estado_pago === 'pagada' && 'Pagado'}
                        {formData.estado_pago === 'no_pagada' && 'No Pagado'}
                        {formData.estado_pago === 'pendiente' && 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </div>
                <Label htmlFor="estado_pago">Cambiar estado de pago</Label>
                <Select value={formData.estado_pago} onValueChange={(value) => handleInputChange('estado_pago', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagada">Pagado</SelectItem>
                    <SelectItem value="no_pagada">No Pagado</SelectItem>
                  </SelectContent>
                </Select>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-900">Actualmente Asignado</span>
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
                  <div>
                    <Label htmlFor="project_assignment">Cambiar asignación</Label>
                    <Select value={formData.project_id || 'unassign'} onValueChange={(value) => handleInputChange('project_id', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassign">Sin asignar</SelectItem>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.code} {project.clients?.name && `- ${project.clients.name}`}
                            {project.clients && ` (${project.clients.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                  <div>
                    <Label htmlFor="project_assignment">Asignar proyecto</Label>
                    <Select value={formData.project_id || 'unassign'} onValueChange={(value) => handleInputChange('project_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassign">Sin asignar</SelectItem>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.code} {project.clients?.name && `- ${project.clients.name}`}
                            {project.clients && ` (${project.clients.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

          {/* Botón de guardado */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-2"
              size="lg"
            >
              <Save className="h-5 w-5" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailDialog;
