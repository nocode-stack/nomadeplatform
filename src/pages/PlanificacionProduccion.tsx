import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Search, Filter, Clock, CheckCircle, XCircle, Package, User, Car, Zap, Calendar as CalendarIcon, Edit, Calculator, Settings2, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { CreateSlotsDialog } from '../components/production/CreateSlotsDialog';
import { ModifyTimesDialog } from '../components/production/ModifyTimesDialog';
import { EditProductionSlotDialog } from '../components/production/EditProductionSlotDialog';
import VehiclePreviewDialog from '../components/vehicles/VehiclePreviewDialog';

interface ProductionSlot {
  id: string;
  production_code: string;
  start_date: string | null;
  end_date: string | null;
  project_id: string | null;
  status?: 'available' | 'assigned' | 'completed' | 'cancelled';
  project_name?: string;
  project_model?: string;
  project_code?: string;
  client_name?: string;
  vehicle_specs?: string;
  project_status?: string;
  project_progress?: number;
  vehicle_info?: {
    id: string;
    vehicle_code?: string;
    matricula?: string;
    numero_bastidor?: string;
    motorizacion?: string;
    color_exterior?: string;
    plazas?: string;
    proveedor?: string;
    ubicacion?: string;
    estado_pago?: string;
    created_at?: string;
    updated_at?: string;
  };
}

const PlanificacionProduccion = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateSlotsDialog, setShowCreateSlotsDialog] = useState(false);
  const [showModifyTimesDialog, setShowModifyTimesDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ProductionSlot | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch production slots with project and vehicle data
  const {
    data: productionSlots = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['production-slots'],
    queryFn: async (): Promise<ProductionSlot[]> => {
      if (import.meta.env.DEV) console.log('📡 Fetching production slots...');

      // First, get all production schedule entries
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('NEW_Production_Schedule')
        .select('*')
        .order('production_code', { ascending: true });

      if (scheduleError) {
        console.error('❌ Error fetching production schedule:', scheduleError);
        throw scheduleError;
      }

      // Then for each entry with a project, get the project details
      const dataWithProjects = await Promise.all(
        (scheduleData || []).map(async (slot) => {
          if (slot.project_id) {
            // Try NEW_Projects first (nueva estructura)
            let projectData = null;
            const { data: newProjectData } = await supabase
              .from('NEW_Projects')
              .select(`
                id,
                project_code,
                status,
                vehicle_id,
                NEW_Clients (
                  name
                )
              `)
              .eq('id', slot.project_id)
              .maybeSingle();

            if (newProjectData) {
              // Calcular progreso real desde las fases del proyecto
              const { data: phaseProgress } = await supabase
                .from('NEW_Project_Phase_Progress')
                .select('status')
                .eq('project_id', newProjectData.id);

              const totalPhases = phaseProgress?.length || 0;
              const completedPhases = phaseProgress?.filter(p => p.status === 'completed').length || 0;
              const calculatedProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

              // Obtener información del vehículo para determinar el modelo
              const { data: vehicleData } = await supabase
                .from('NEW_Vehicles')
                .select('engine, transmission_type, plazas')
                .eq('project_id', newProjectData.id)
                .maybeSingle();

              const vehicleModel = vehicleData
                ? `${vehicleData.engine || ''} ${vehicleData.transmission_type || ''} ${vehicleData.plazas ? vehicleData.plazas + ' plazas' : ''}`.trim()
                : 'Por definir';

              projectData = {
                ...newProjectData,
                model: vehicleModel,
                power: vehicleData?.engine || 'Por definir',
                progress: calculatedProgress,
                clients: newProjectData.NEW_Clients
              };
            }
            // Note: Removed fallback to old projects table since it no longer exists

            return { ...slot, projects: projectData };
          }
          return { ...slot, projects: null };
        })
      );

      // Para cada slot con proyecto asignado, obtener también la información del vehículo
      const transformedData: ProductionSlot[] = await Promise.all(
        dataWithProjects.map(async (slot) => {
          let vehicleInfo = null;

          // Buscar vehículo asignado en NEW_Vehicles por project_id
          if (slot.project_id) {
            const { data: newVehicleData } = await supabase
              .from('NEW_Vehicles')
              .select(`
                id, 
                vehicle_code, 
                numero_bastidor, 
                matricula, 
                engine,
                transmission_type,
                exterior_color,
                plazas,
                proveedor, 
                location, 
                estado_pago, 
                created_at, 
                updated_at
              `)
              .eq('project_id', slot.project_id)
              .maybeSingle();

            if (newVehicleData) {
              vehicleInfo = {
                id: newVehicleData.id,
                vehicle_code: newVehicleData.vehicle_code,
                numero_bastidor: newVehicleData.numero_bastidor,
                matricula: newVehicleData.matricula || 'Sin asignar',
                motorizacion: `${newVehicleData.engine || ''} ${newVehicleData.transmission_type || ''}`.trim() || 'Por definir',
                color_exterior: newVehicleData.exterior_color || 'Por definir',
                plazas: newVehicleData.plazas || '2',
                proveedor: newVehicleData.proveedor || 'Sin proveedor',
                ubicacion: newVehicleData.location || 'Sin ubicación',
                estado_pago: newVehicleData.estado_pago || 'pendiente',
                created_at: newVehicleData.created_at,
                updated_at: newVehicleData.updated_at
              };
            }
          }

          return {
            id: slot.id,
            production_code: slot.production_code,
            start_date: slot.start_date,
            end_date: slot.end_date,
            project_id: slot.project_id,
            status: slot.project_id ? 'assigned' : 'available',
            project_name: slot.projects?.name || slot.projects?.project_code,
            project_model: slot.projects?.model,
            client_name: slot.projects?.clients?.name || slot.projects?.NEW_Clients?.name || 'Cliente por determinar',
            vehicle_specs: slot.projects?.power,
            project_status: slot.projects?.status,
            project_progress: slot.projects?.progress || 0,
            project_code: slot.projects?.project_code || slot.projects?.code,
            vehicle_info: vehicleInfo
          };
        })
      );

      if (import.meta.env.DEV) console.log('✅ Production slots fetched:', transformedData.length);
      return transformedData;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Auto-refresh when project queries are invalidated
  useEffect(() => {
    const interval = setInterval(() => {
      if (import.meta.env.DEV) console.log('🔄 Auto-refreshing production slots...');
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleClientClick = (projectId: string) => {
    navigate(`/proyectos/${projectId}`);
  };

  const handleVehicleClick = (vehicleInfo: any, projectInfo?: any) => {
    setSelectedVehicle({
      ...vehicleInfo,
      motorizacion: vehicleInfo.motorizacion || '140cv manual',
      ubicacion: vehicleInfo.ubicacion || 'nomade',
      estado_pago: vehicleInfo.estado_pago || 'pendiente',
      plazas: vehicleInfo.plazas || 2,
      created_at: vehicleInfo.created_at || new Date().toISOString(),
      updated_at: vehicleInfo.updated_at || new Date().toISOString(),
      // Add project information if available
      NEW_Projects: projectInfo ? {
        id: projectInfo.project_id,
        project_code: projectInfo.project_code,
        NEW_Clients: projectInfo.client_name ? { name: projectInfo.client_name } : null
      } : null
    });
    setShowVehicleDialog(true);
  };

  const filteredSlots = productionSlots.filter(slot =>
    slot.production_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (slot.project_name && slot.project_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (slot.client_name && slot.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: 'Disponible', className: 'bg-green-100 text-green-800 border-green-200' },
      assigned: { label: 'Asignado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      completed: { label: 'Completado', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getProjectStatusBadge = (status: string) => {
    const statusConfig = {
      prospect: { label: 'Prospecto', className: 'bg-yellow-100 text-yellow-800' },
      pre_production: { label: 'Pre-Producción', className: 'bg-blue-100 text-blue-800' },
      production: { label: 'En Producción', className: 'bg-orange-100 text-orange-800' },
      reworks: { label: 'Retrabajos', className: 'bg-red-100 text-red-800' },
      pre_delivery: { label: 'Pre-Entrega', className: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
      repair: { label: 'Reparación', className: 'bg-purple-100 text-purple-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status || 'Sin estado', className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Layout title="Planificación de Producción">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando planificación...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Planificación de Producción" subtitle="Gestión de códigos de producción y fechas variables">
      <div className="pt-0 space-y-6 animate-blur-in">
        {/* Compact Header */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden !mt-0 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-primary/10"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20 animate-scale-in">
                  <Activity className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Planificación de Producción</h1>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest ml-[52px]">Flujo de trabajo y códigos de fabricación</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Button
                onClick={() => setShowCreateSlotsDialog(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-12 px-6 rounded-xl transition-all active:scale-95"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Slots Nueva Temporada
              </Button>
              <Button
                onClick={() => setShowModifyTimesDialog(true)}
                variant="outline"
                className="border-border hover:bg-muted text-foreground h-12 px-6 rounded-xl transition-all"
              >
                <Settings2 className="h-5 w-5 mr-2" />
                Ajustar Fechas Globales
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border shadow-md animate-fade-in-up [animation-delay:100ms] group hover:border-primary/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Slots</p>
                  <p className="text-2xl font-bold text-foreground">{productionSlots.length}</p>
                </div>
                <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/10 transition-colors">
                  <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md animate-fade-in-up [animation-delay:200ms] group hover:border-success/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-1">Disponibles</p>
                  <p className="text-2xl font-bold text-foreground">
                    {productionSlots.filter(s => s.status === 'available' || (!s.project_id)).length}
                  </p>
                </div>
                <div className="bg-success/10 p-3 rounded-xl">
                  <Clock className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md animate-fade-in-up [animation-delay:300ms] group hover:border-primary/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Asignados</p>
                  <p className="text-2xl font-bold text-foreground">
                    {productionSlots.filter(s => s.status === 'assigned' || s.project_id).length}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md animate-fade-in-up [animation-delay:400ms] group hover:border-primary/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Completados</p>
                  <p className="text-2xl font-bold text-foreground">
                    {productionSlots.filter(s => s.status === 'completed').length}
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/10 transition-colors">
                  <CheckCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-card border-border shadow-lg animate-fade-in-up [animation-delay:500ms]">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, proyecto o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-sm bg-background border-border rounded-xl focus:ring-primary/10 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Slots List - Updated with green background for assigned slots */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Slots de Producción</h2>

          {filteredSlots.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-base">No se encontraron slots de producción</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredSlots.map((slot) => {
                const isAssigned = slot.status === 'assigned' || slot.project_id !== null;

                return (
                  <Card
                    key={slot.id}
                    className={`hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 border-l-4 cursor-pointer group animate-fade-in-up ${isAssigned
                      ? 'border-l-success bg-card'
                      : 'border-l-primary bg-card'
                      }`}
                    style={{ animationDelay: `${(productionSlots.indexOf(slot) % 10) * 30}ms` }}
                  >
                    <CardContent className="p-4">
                      {/* Top row: Code, Duration, Status/Progress */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className={`rounded-xl p-3 shadow-sm transition-transform group-hover:scale-110 ${isAssigned ? 'bg-success/20' : 'bg-primary/20'
                            }`}>
                            <Package className={`h-6 w-6 ${isAssigned ? 'text-success' : 'text-primary'
                              }`} />
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`font-mono font-bold text-2xl tracking-tighter ${isAssigned ? 'text-foreground' : 'text-foreground/80'
                              }`}>
                              {slot.production_code}
                            </span>
                          </div>
                        </div>

                        {/* Status/Progress section */}
                        <div className="flex items-center gap-4">
                          {isAssigned && slot.project_status ? (
                            <div className="bg-muted/30 border border-border rounded-xl px-4 py-2 flex items-center gap-4">
                              {getProjectStatusBadge(slot.project_status)}
                              <div className="flex items-center gap-3">
                                <Progress value={slot.project_progress} className="h-2 w-24 bg-background" />
                                <span className="text-xs font-bold text-foreground min-w-[35px]">
                                  {slot.project_progress}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Disponible
                              </Badge>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setShowEditDialog(true);
                            }}
                            className="border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl px-4 px-4 h-10 transition-all font-bold text-xs"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            GESTIONAR SLOT
                          </Button>
                        </div>
                      </div>

                      {/* Main content grid - 3 columns with updated color scheme */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Dates section */}
                        <div className={`rounded-xl p-4 border transition-all ${isAssigned ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border'
                          }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarIcon className={`h-4 w-4 ${isAssigned ? 'text-success' : 'text-muted-foreground'
                              }`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isAssigned ? 'text-success' : 'text-muted-foreground'
                              }`}>Cronograma</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground/60 font-bold uppercase">Inicio Fase</span>
                              <span className="text-sm font-bold text-foreground">
                                {formatDate(slot.start_date)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground/60 font-bold uppercase">Fin Estimado</span>
                              <span className="text-sm font-bold text-primary">
                                {formatDate(slot.end_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Client/Project section - Blue when assigned, Gray when not */}
                        <div className={`rounded-xl p-4 border transition-all ${isAssigned
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/30 border-border'
                          }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <User className={`h-4 w-4 ${isAssigned ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isAssigned ? 'text-primary' : 'text-muted-foreground'
                              }`}>Cliente & Actividad</span>
                          </div>
                          {isAssigned ? (
                            <button
                              onClick={() => handleClientClick(slot.project_id!)}
                              className="text-left hover:bg-primary/10 rounded-xl p-3 px-4 transition-all w-full border border-transparent hover:border-primary/20 group/btn"
                            >
                              <p className="text-foreground font-bold text-sm truncate mb-1">
                                {slot.client_name}
                              </p>
                              <p className="text-primary font-bold text-[10px] tracking-wider uppercase mb-2">
                                {slot.project_code}
                              </p>
                              <div className="flex items-center gap-2">
                                <Car className="h-3.5 w-3.5 text-muted-foreground group-hover/btn:text-primary" />
                                <span className="text-muted-foreground text-[11px] font-medium truncate group-hover/btn:text-foreground">
                                  {slot.project_model}
                                </span>
                              </div>
                            </button>
                          ) : (
                            <div className="text-center text-gray-500 py-3">
                              <div className="text-xs">Sin asignar</div>
                            </div>
                          )}
                        </div>

                        {/* Vehicle section - Purple when assigned, Gray when not */}
                        <div className={`rounded-xl p-4 border transition-all ${isAssigned && slot.vehicle_info
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-muted/30 border-border'
                          }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Car className={`h-4 w-4 ${isAssigned && slot.vehicle_info ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isAssigned && slot.vehicle_info ? 'text-primary' : 'text-muted-foreground'
                              }`}>Unidad de Flota</span>
                          </div>
                          {slot.vehicle_info ? (
                            <button
                              onClick={() => handleVehicleClick(slot.vehicle_info, {
                                project_id: slot.project_id,
                                project_code: slot.project_code,
                                client_name: slot.client_name
                              })}
                              className="text-left hover:bg-card rounded-xl p-3 px-4 transition-all w-full border border-transparent hover:border-primary/20 shadow-sm bg-background group/vbtn"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-foreground font-bold text-sm truncate">
                                  {slot.vehicle_info.vehicle_code}
                                </p>
                                <div className="p-1 bg-primary/10 rounded text-primary">
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                              </div>
                              {slot.vehicle_info.matricula && (
                                <p className="text-primary font-bold text-[10px] tracking-wider mb-2">
                                  MATRICULA: {slot.vehicle_info.matricula}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex items-center gap-1.5">
                                  <Zap className="h-3 w-3 text-muted-foreground group-hover/vbtn:text-primary" />
                                  <span className="text-muted-foreground text-[10px] font-bold truncate">
                                    {slot.vehicle_info.motorizacion}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Car className="h-3 w-3 text-muted-foreground group-hover/vbtn:text-primary" />
                                  <span className="text-muted-foreground text-[10px] font-bold">
                                    {slot.vehicle_info.plazas} PLAZAS
                                  </span>
                                </div>
                              </div>
                            </button>
                          ) : (
                            <div className="text-center text-gray-500 py-3">
                              <div className="text-xs">Sin vehículo</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateSlotsDialog
        open={showCreateSlotsDialog}
        onOpenChange={setShowCreateSlotsDialog}
        onSuccess={() => {
          refetch();
          setShowCreateSlotsDialog(false);
        }}
      />

      <ModifyTimesDialog
        open={showModifyTimesDialog}
        onOpenChange={setShowModifyTimesDialog}
        onSuccess={() => {
          refetch();
          setShowModifyTimesDialog(false);
        }}
      />

      <EditProductionSlotDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        slot={selectedSlot}
        onSuccess={() => {
          refetch();
          setShowEditDialog(false);
          setSelectedSlot(null);
        }}
      />

      {/* Vehicle Preview Dialog */}
      {selectedVehicle && (
        <VehiclePreviewDialog
          vehicle={selectedVehicle}
          open={showVehicleDialog}
          onOpenChange={setShowVehicleDialog}
        />
      )}
    </Layout>
  );
};

export default PlanificacionProduccion;
