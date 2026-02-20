
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Car,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Palette,
  Zap,
  ExternalLink,
  CalendarCheck,
  Factory
} from 'lucide-react';
import { UnifiedProject } from '../../types/database';
import { NewIncident } from '../../hooks/useNewIncidents';
import { formatDate, getStatusText } from '../../utils/projectUtils';
import VehiclePreviewDialog from '../vehicles/VehiclePreviewDialog';
import { useNavigate } from 'react-router-dom';
import { useProjectPhases } from '../../hooks/useUnifiedProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';

interface ProjectSummaryProps {
  project: UnifiedProject;
  incidents: NewIncident[];
}

// Función para mapear motorización del presupuesto primario al formato de interfaz
const getMotorizationFromBudget = (
  primaryBudget: { engine_options?: { power?: string; transmission?: string } | null } | null | undefined,
  vehicleEngine: string | null
): '140cv manual' | '180cv automatica' => {
  if (import.meta.env.DEV) console.log('🔍 Mapping motorization - Budget:', primaryBudget?.engine_options, 'Vehicle:', vehicleEngine);

  // Priorizar datos del presupuesto primario si existen
  if (primaryBudget?.engine_options) {
    const power = primaryBudget.engine_options.power || '';
    const transmission = primaryBudget.engine_options.transmission || '';

    if (import.meta.env.DEV) console.log('✅ Using budget data - Power:', power, 'Transmission:', transmission);

    // Mapear según los datos del presupuesto
    if (power.includes('180') && transmission.toLowerCase().includes('automát')) {
      return '180cv automatica';
    }
    if (power.includes('140') && transmission.toLowerCase().includes('manual')) {
      return '140cv manual';
    }

    // Si contiene 180cv pero no especifica transmisión, asumir automática
    if (power.includes('180')) {
      return '180cv automatica';
    }
  }

  // Fallback: usar datos del vehículo si no hay presupuesto
  if (vehicleEngine) {
    if (import.meta.env.DEV) console.log('📋 Fallback to vehicle data:', vehicleEngine);

    if (vehicleEngine.toLowerCase().includes('180') && vehicleEngine.toLowerCase().includes('automát')) {
      return '180cv automatica';
    }
    if (vehicleEngine.toLowerCase().includes('140') && vehicleEngine.toLowerCase().includes('manual')) {
      return '140cv manual';
    }

    // Si contiene 180cv, asumir automática
    if (vehicleEngine.toLowerCase().includes('180')) {
      return '180cv automatica';
    }
  }

  if (import.meta.env.DEV) console.log('⚠️ No mapping found, using default: 140cv manual');
  // Fallback por defecto
  return '140cv manual';
};

const ProjectSummary = ({ project, incidents }: ProjectSummaryProps) => {
  const navigate = useNavigate();
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const { phases, isLoading: phasesLoading } = useProjectPhases(project.id);

  // Fetch primary budget for vehicle specs comparison
  const { data: primaryBudget } = useQuery({
    queryKey: ['budget', project.id, 'primary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Budget')
        .select(`
          *,
          engine_options!NEW_Budget_engine_option_id_fkey(name, power, transmission),
          exterior_color_options!NEW_Budget_exterior_color_id_fkey(name)
        `)
        .eq('project_id', project.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!project.id
  });


  // Debug: Log para verificar sincronización
  if (import.meta.env.DEV) console.log('🔍 ProjectSummary - Project data:', {
    id: project.id,
    status: project.status,
    progress: project.progress,
    currentPhase: project.currentPhase,
    client_status: project.new_clients?.client_status
  });
  if (import.meta.env.DEV) console.log('🔍 ProjectSummary - Phases data:', phases);

  // Filtrar incidencias por estado
  const activeIncidents = incidents.filter(i => i.status?.status_code !== 'terminada');
  const completedIncidents = incidents.filter(i => i.status?.status_code === 'terminada');

  const handleVehicleClick = () => {
    if (project.vehicles) {
      setIsVehicleDialogOpen(true);
    }
  };

  // Verificar si tiene código de producción asignado - usar production_slot en lugar de project_codes
  const hasProductionCode = project.production_slot;

  // Calcular fechas basadas en el production_slot si existe, o estimadas si no
  const getEstimatedDates = () => {
    if (hasProductionCode && project.production_slot) {
      // Usar fechas reales del slot de producción
      const productionStartDate = new Date(project.production_slot.start_date);
      const productionEndDate = new Date(project.production_slot.end_date);

      const deliveryDate = new Date(productionEndDate);
      deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 días para pre-entrega

      return {
        productionStart: productionStartDate,
        productionEnd: productionEndDate,
        delivery: deliveryDate
      };
    } else {
      // Fechas estimadas si no hay slot de producción
      const createdDate = new Date(project.created_at);
      const productionStartDate = new Date(createdDate);
      productionStartDate.setDate(productionStartDate.getDate() + 15); // 15 días después de creado

      const productionEndDate = new Date(productionStartDate);
      productionEndDate.setDate(productionEndDate.getDate() + 30); // 30 días de producción

      const deliveryDate = new Date(productionEndDate);
      deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 días para pre-entrega

      return {
        productionStart: productionStartDate,
        productionEnd: productionEndDate,
        delivery: deliveryDate
      };
    }
  };

  const dates = getEstimatedDates();

  // Determinar fase actual y progreso basado en las fases del proyecto
  const getCurrentPhase = () => {
    // Usar las fases del hook si están disponibles
    if (phases && phases.length > 0) {
      const completedPhases = phases.filter(p => p.status === 'completed');
      const inProgressPhases = phases.filter(p => p.status === 'in_progress');

      // Si hay una fase en progreso, mostrar su grupo
      if (inProgressPhases.length > 0) {
        const currentPhase = inProgressPhases[0];
        return currentPhase.NEW_Project_Phase_Template?.group || 'Fase en progreso';
      }

      // Si no hay fases en progreso, buscar la siguiente pendiente
      const pendingPhases = phases.filter(p => p.status === 'pending');
      if (pendingPhases.length > 0) {
        const nextPhase = pendingPhases.sort((a, b) =>
          (a.NEW_Project_Phase_Template?.phase_order || 0) - (b.NEW_Project_Phase_Template?.phase_order || 0)
        )[0];
        return nextPhase.NEW_Project_Phase_Template?.group || 'Siguiente fase';
      }

      // Si no hay fases pendientes, mostrar el grupo de la última completada
      if (completedPhases.length > 0) {
        const lastCompleted = completedPhases.sort((a, b) =>
          (b.NEW_Project_Phase_Template?.phase_order || 0) - (a.NEW_Project_Phase_Template?.phase_order || 0)
        )[0];
        return lastCompleted.NEW_Project_Phase_Template?.group || 'Fase completada';
      }
    }

    // Fallback al comportamiento anterior si no hay fases
    const progress = project.progress || 0;
    if (project.status === 'delivered') return 'Entregado';
    if (project.status === 'pre_delivery') return 'Pre-entrega';
    if (project.status === 'production') {
      if (progress >= 80) return 'Acabados finales';
      if (progress >= 60) return 'Instalación eléctrica';
      if (progress >= 40) return 'Mobiliario interior';
      if (progress >= 20) return 'Estructura base';
      return 'Inicio producción';
    }
    if (project.status === 'reworks') return 'Correcciones';
    if (project.status === 'pre_production') return 'Preparación producción';
    return 'Análisis inicial';
  };

  // Calcular progreso real basado en las fases
  const getCurrentProgress = () => {
    if (phases && phases.length > 0) {
      const completedPhases = phases.filter(p => p.status === 'completed');
      return Math.round((completedPhases.length / phases.length) * 100);
    }
    return project.progress || 0;
  };

  // Función para obtener el texto del estado correctamente
  const getProjectStatusText = () => {
    // Log para debug
    if (import.meta.env.DEV) console.log('🔍 getProjectStatusText - client_status:', project.new_clients?.client_status);
    if (import.meta.env.DEV) console.log('🔍 getProjectStatusText - project.status:', project.status);

    // Si es un prospecto, mostrar "Prospecto"
    if (project.new_clients?.client_status === 'prospect') {
      return 'Prospecto';
    }

    // Si es un cliente real, usar el estado del proyecto
    if (project.status) {
      return getStatusText(project.status);
    }

    // Fallback
    return 'Sin estado';
  };

  return (
    <div className="space-y-6">

      {/* Grid de 4 bloques informativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha de Entrega Prevista */}
        <Card className={`border-2 ${hasProductionCode ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium flex items-center ${hasProductionCode ? 'text-green-700' : 'text-gray-500'}`}>
              <CalendarCheck className="h-4 w-4 mr-2" />
              Fecha Entrega Prevista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${hasProductionCode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-lg font-bold ${hasProductionCode ? 'text-green-800' : 'text-gray-500'}`}>
                  {hasProductionCode ? formatDate(dates.delivery.toISOString()) : 'No calculada'}
                </span>
              </div>
              <p className={`text-sm ${hasProductionCode ? 'text-green-600' : 'text-gray-500'}`}>
                {hasProductionCode
                  ? `Código: ${project.production_slot?.production_code}`
                  : 'Asigna un código de producción'
                }
              </p>
              <div className={`${hasProductionCode ? 'bg-green-100' : 'bg-gray-100'} rounded-lg p-2`}>
                <div className={`text-xs font-medium ${hasProductionCode ? 'text-green-700' : 'text-gray-500'}`}>
                  {hasProductionCode
                    ? (project.status === 'delivered' ? 'Completado' :
                      project.status === 'pre_delivery' ? 'En pre-entrega' :
                        `Faltan ${Math.max(0, Math.ceil((dates.delivery.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días aprox.`)
                    : 'Sin código de producción asignado'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fechas de Producción Unificadas */}
        <Card className={`border-2 ${hasProductionCode ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium flex items-center ${hasProductionCode ? 'text-blue-700' : 'text-gray-500'}`}>
              <Factory className="h-4 w-4 mr-2" />
              Producción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${hasProductionCode ? 'text-blue-600' : 'text-gray-500'}`}>Entrada:</span>
                  <span className={`text-sm font-bold ${hasProductionCode ? 'text-blue-800' : 'text-gray-500'}`}>
                    {hasProductionCode ? formatDate(dates.productionStart.toISOString()) : 'No calculada'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${hasProductionCode ? 'text-blue-600' : 'text-gray-500'}`}>Salida:</span>
                  <span className={`text-sm font-bold ${hasProductionCode ? 'text-blue-800' : 'text-gray-500'}`}>
                    {hasProductionCode ? formatDate(dates.productionEnd.toISOString()) : 'No calculada'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${hasProductionCode
                    ? (project.status === 'production' || project.status === 'pre_delivery' || project.status === 'delivered'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600')
                    : 'bg-gray-100 text-gray-500'
                    }`}
                >
                  {hasProductionCode
                    ? (project.status === 'production' || project.status === 'pre_delivery' || project.status === 'delivered'
                      ? 'En proceso' : 'Pendiente')
                    : 'Sin programar'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehículo Asignado */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Car className="h-4 w-4 mr-2" />
              Vehículo Asignado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {project.vehicles ? (
              <button
                onClick={handleVehicleClick}
                className="w-full text-left p-3 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 transition-all duration-200 cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-purple-900 text-sm truncate">
                        {project.vehicles.numero_bastidor}
                      </p>
                      <p className="text-xs text-purple-600 mt-0.5">
                        Código: {project.vehicles.vehicle_code}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-purple-600">Matrícula:</span>
                        <span className="text-purple-800 font-medium">
                          {project.vehicles.matricula || 'Sin asignar'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-600">Plazas:</span>
                        <span className="text-purple-800">{project.vehicles.plazas || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-purple-600">Motor:</span>
                        <span className="text-purple-800 text-right">
                          {primaryBudget?.engine_options ?
                            `${primaryBudget.engine_options.power} ${primaryBudget.engine_options.transmission}` :
                            project.vehicles.engine || '-'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-600">Color:</span>
                        <span className="text-purple-800 capitalize text-right">{project.vehicles.exterior_color || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-100 rounded p-2">
                    <div className="text-xs text-purple-700">
                      <strong>Proveedor:</strong> {project.vehicles.proveedor}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Vehículo no asignado</p>
                    <p className="text-sm text-gray-400">
                      Asigna un vehículo para continuar con la producción
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fase del Proyecto Detallada */}
        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Fase Actual del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {phasesLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-800">
                    {getProjectStatusText()}
                  </span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-medium">
                    {getCurrentProgress()}%
                  </Badge>
                </div>

                {/* Barra de progreso mejorada */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${getCurrentProgress()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Inicio</span>
                    <span>Progreso actual</span>
                    <span>Entrega</span>
                  </div>
                </div>

                {/* Información simplificada de fases - adelantada dos posiciones */}
                {phases && phases.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="space-y-2">
                      {(() => {
                        const sortedPhases = phases
                          .sort((a, b) => (a.NEW_Project_Phase_Template?.phase_order || 0) - (b.NEW_Project_Phase_Template?.phase_order || 0));

                        // Obtener fases pendientes (las que vienen)
                        const pendingPhases = sortedPhases.filter(p => p.status === 'pending');

                        // Fase actual = primera pendiente (la que va a empezar)
                        const currentPhase = pendingPhases[0];
                        // Siguiente fase = segunda pendiente (la que viene después)
                        const nextPhase = pendingPhases[1];

                        return (
                          <>
                            <div className="text-sm">
                              <span className="font-medium text-orange-700">Fase actual: </span>
                              <span className="text-orange-800">
                                {currentPhase?.NEW_Project_Phase_Template?.phase_name || 'En curso'}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-orange-700">Siguiente fase: </span>
                              <span className="text-orange-800">
                                {nextPhase?.NEW_Project_Phase_Template?.phase_name || 'Siguiente'}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}


              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de vista del vehículo */}
      {project.vehicles && (
        <VehiclePreviewDialog
          vehicle={{
            id: project.vehicles.id,
            numero_bastidor: project.vehicles.numero_bastidor,
            matricula: project.vehicles.matricula,
            color_exterior: project.vehicles.exterior_color || '-',
            motorizacion: getMotorizationFromBudget(primaryBudget, project.vehicles.engine ?? null),
            ubicacion: (project.vehicles.location as 'nomade' | 'concesionario' | 'taller' | 'cliente') || 'nomade',
            estado_pago: (project.vehicles.estado_pago as 'pagada' | 'no_pagada' | 'pendiente') || 'pendiente',
            plazas: parseInt(project.vehicles.plazas || '2') as 2 | 3,
            proveedor: project.vehicles.proveedor || '-',
            created_at: project.vehicles.created_at || new Date().toISOString(),
            updated_at: project.vehicles.updated_at || new Date().toISOString(),
            // Incluir información del proyecto para que aparezca como asignado
            NEW_Projects: {
              id: project.id,
              project_code: project.project_code || '',
              NEW_Clients: project.clients ? {
                name: project.clients.name || ''
              } : null
            }
          }}
          open={isVehicleDialogOpen}
          onOpenChange={setIsVehicleDialogOpen}
        />
      )}
    </div>
  );
};

export default ProjectSummary;
