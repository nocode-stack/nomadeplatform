
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  FileText,
  Package,
  Car,
  Palette,
  Zap,
  Euro,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  Ruler,
  Cog
} from 'lucide-react';
import { formatDate } from '../../utils/projectUtils';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedProject } from '../../hooks/useUnifiedProjects';

// Local interfaces that match the NEW_Budget structure
interface DatabaseBudget {
  id: string;
  budget_code: string | null;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  engine_option?: { name?: string; power?: string; transmission?: string } | null;
  model_option?: { name?: string } | null;
  pack?: { name?: string } | null;
  electric_system?: { name?: string } | null;
}

interface DatabaseBudgetItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  line_total: number;
  description?: string;
  removed_components?: unknown; // This comes as Json from the database
}

interface ProjectSpecsFromBudgetProps {
  projectId: string;
}

const ProjectSpecsFromBudget = ({ projectId }: ProjectSpecsFromBudgetProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get project data including vehicle info
  const { data: project } = useUnifiedProject(projectId);

  const { data: budgets, isLoading, error, refetch } = useQuery({
    queryKey: ['project-budgets', projectId],
    queryFn: async (): Promise<DatabaseBudget[]> => {


      const { data, error } = await supabase
        .from('NEW_Budget')
        .select(`
          *,
          engine_option:engine_options(*),
          model_option:model_options(*),
          pack:NEW_Budget_Packs(*),
          electric_system:NEW_Budget_Electric(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {

        throw error;
      }


      return data || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Force refresh project data whenever budget changes
  const refreshProjectData = () => {

    queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
    queryClient.invalidateQueries({ queryKey: ['unified-projects', 'detail', projectId] });
    queryClient.refetchQueries({ queryKey: ['unified-projects', 'detail', projectId] });
  };

  // Auto-refresh project data when budget changes
  useEffect(() => {
    if (budgets && budgets.length > 0) {

      refreshProjectData();
    }
  }, [budgets]);

  // Manual refresh function
  const handleManualRefresh = () => {
    refetch(); // Refetch budget data
    refreshProjectData(); // Refresh project data
    toast({
      title: "Datos actualizados",
      description: "Los datos del proyecto se han actualizado desde el presupuesto.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Especificaciones del Proyecto</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Cargando especificaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error al cargar especificaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No se pudieron cargar las especificaciones del proyecto.</p>
        </CardContent>
      </Card>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Especificaciones del Proyecto</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin especificaciones definidas</h3>
            <p className="text-gray-600 mb-4">
              Las especificaciones del vehículo se definirán cuando se cree un presupuesto para este proyecto.
            </p>
            <Button variant="outline" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Crear Presupuesto</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Usar el presupuesto más reciente (ya que solo puede haber uno por proyecto)
  const activeBudget = budgets[0];

  // Extraer información del presupuesto usando la nueva estructura
  const getSpecsFromBudget = (budget: DatabaseBudget) => {
    const specs = {
      model: budget.model_option?.name || '',
      vehicleOption: budget.engine_option?.name || '',
      packs: budget.pack?.name ? [budget.pack.name] : [],
      extras: [] as string[], // Los extras ahora están en NEW_Budget_Items
      electricSystem: budget.electric_system?.name || '',
      interiorColor: '',
      discounts: [] as { name: string; amount: number }[]
    };

    return specs;
  };

  const specs = getSpecsFromBudget(activeBudget);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Especificaciones del Proyecto</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Actualizar</span>
            </Button>
            <Badge
              variant={activeBudget.status === 'approved' ? 'default' : 'secondary'}
              className={activeBudget.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
            >
              {activeBudget.status === 'approved' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Presupuesto Aprobado
                </>
              ) : (
                'Presupuesto Borrador'
              )}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {activeBudget.budget_code}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información del Presupuesto */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Presupuesto único del proyecto - {formatDate(activeBudget.created_at)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-800">
                {activeBudget.total.toLocaleString('es-ES')}€
              </span>
            </div>
          </div>
          <p className="text-sm text-blue-600">
            Los datos del proyecto se actualizan automáticamente desde este presupuesto.
            Solo se permite un presupuesto por proyecto para evitar confusiones.
          </p>
        </div>

        {/* Especificaciones del Vehículo Asignado */}

        {(() => {
          if (!project?.vehicles) {
            return (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700 flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Vehículo Sin Asignar
                  </h4>
                </div>
                <div className="text-center py-6">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay vehículo asignado</h3>
                  <p className="text-gray-600 mb-4">
                    Este proyecto no tiene un vehículo físico asignado. Asigna un vehículo para ver sus especificaciones.
                  </p>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                    onClick={() => {
                      toast({
                        title: 'Asignación de vehículo',
                        description: 'Navega a la sección de Vehículos para asignar uno a este proyecto.',
                      });
                    }}
                  >
                    <Car className="h-4 w-4" />
                    <span>Asignar Vehículo</span>
                  </Button>
                </div>
              </div>
            );
          }
          const vehicleData = project.vehicles as unknown as Record<string, unknown>;
          const vehicleSettings = vehicleData?.vehicle_settings as Record<string, string> | undefined;
          if (!vehicleSettings) {
            return (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700 flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Vehículo Sin Asignar
                  </h4>
                </div>
                <div className="text-center py-6">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay vehículo asignado</h3>
                  <p className="text-gray-600 mb-4">
                    Este proyecto no tiene un vehículo físico asignado. Asigna un vehículo para ver sus especificaciones.
                  </p>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                    onClick={() => {
                      toast({
                        title: 'Asignación de vehículo',
                        description: 'Navega a la sección de Vehículos para asignar uno a este proyecto.',
                      });
                    }}
                  >
                    <Car className="h-4 w-4" />
                    <span>Asignar Vehículo</span>
                  </Button>
                </div>
              </div>
            );
          }
          return (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-purple-900 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Vehículo Asignado
                </h4>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                  {vehicleData.vehicle_code as string}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <div>
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Modelo</label>
                    <p className="text-purple-900 font-semibold text-sm">{vehicleSettings.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <div>
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Motor</label>
                    <p className="text-purple-900 font-semibold text-sm">{vehicleSettings.engine}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <Cog className="h-4 w-4 text-purple-600" />
                  <div>
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Transmisión</label>
                    <p className="text-purple-900 font-semibold text-sm">{vehicleSettings.transmission}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <Palette className="h-4 w-4 text-purple-600" />
                  <div>
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Color</label>
                    <p className="text-purple-900 font-semibold text-sm capitalize">{vehicleSettings.color}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <Ruler className="h-4 w-4 text-purple-600" />
                  <div>
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Dimensiones</label>
                    <p className="text-purple-900 font-semibold text-sm">{vehicleSettings.dimensions}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <Car className="h-4 w-4 text-purple-600" />
                  <div>
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">Bastidor</label>
                    <p className="text-purple-900 font-semibold text-sm">{vehicleData.numero_bastidor as string}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-purple-700 bg-purple-100 rounded p-2">
                ℹ️ Estas especificaciones corresponden al vehículo físico asignado a este proyecto.
              </div>
            </div>
          );
        })()}

        {/* Especificaciones del Presupuesto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modelo y Vehículo Base */}
          {(specs.model || specs.vehicleOption) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Car className="h-4 w-4 mr-2" />
                Vehículo Base
              </h4>
              <div className="space-y-2">
                {specs.model && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Modelo:</span>
                    <Badge variant="outline">{specs.model}</Badge>
                  </div>
                )}
                {specs.vehicleOption && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Motorización:</span>
                    <Badge variant="outline">{specs.vehicleOption}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paquetes */}
          {specs.packs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Paquetes
              </h4>
              <div className="space-y-2">
                {specs.packs.map((pack, index) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                    {pack}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sistema Eléctrico */}
          {specs.electricSystem && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Sistema Eléctrico
              </h4>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                {specs.electricSystem}
              </Badge>
            </div>
          )}

          {/* Color Interior */}
          {specs.interiorColor && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Color Interior
              </h4>
              <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                {specs.interiorColor}
              </Badge>
            </div>
          )}
        </div>

        {/* Extras */}
        {specs.extras.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Opcionales Seleccionados</h4>
            <div className="flex flex-wrap gap-2">
              {specs.extras.map((extra, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  {extra}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Descuentos */}
        {specs.discounts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Descuentos Aplicados</h4>
            <div className="space-y-2">
              {specs.discounts.map((discount, index) => (
                <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded border border-red-200">
                  <span className="text-sm text-red-700">{discount.name}</span>
                  <Badge variant="destructive">
                    {discount.amount < 0 ? '' : '-'}{Math.abs(discount.amount).toLocaleString('es-ES')}€
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Última actualización: {formatDate(activeBudget.updated_at)}</span>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>Ver Presupuesto Completo</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSpecsFromBudget;
