
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { useUnifiedProjectsList } from '../../hooks/useUnifiedProjects';
import { UnifiedProject } from '../../types/database';
import { useProjects } from '../../hooks/useNewProjects';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface AssignVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (projectId?: string) => void;
  vehicleId: string;
  currentProjectId?: string;
  isLoading?: boolean;
  useNewTable?: boolean; // Nueva prop para determinar qué tabla usar
}

interface VehicleForCompat {
  engine?: string | null;
  exterior_color?: string | null;
  transmission_type?: string | null;
  plazas?: string | null;
  [key: string]: unknown;
}

interface BudgetForCompat {
  engine_option?: { name?: string; power?: string; transmission?: string } | null;
  exterior_color_option?: { name?: string } | null;
  model_option?: { name?: string } | null;
  [key: string]: unknown;
}

type ProjectWithBudget = UnifiedProject & { primary_budget: BudgetForCompat | null };

// Helper function to check vehicle-budget compatibility
const isVehicleCompatible = (vehicle: VehicleForCompat | null, budget: BudgetForCompat | null) => {
  if (!vehicle || !budget) return false;

  // Get budget engine data
  const budgetEngine = budget.engine_option?.name || '';
  const budgetPower = budget.engine_option?.power || '';
  const budgetTransmission = budget.engine_option?.transmission || '';
  const budgetColor = budget.exterior_color_option?.name || '';

  // Get vehicle data
  const vehicleEngine = vehicle.engine || '';
  const vehicleColor = vehicle.exterior_color || '';
  const vehicleTransmission = vehicle.transmission_type || '';
  const vehiclePlazas = vehicle.plazas || '';

  // Determine expected plazas based on model name
  const budgetModelName = budget.model_option?.name || '';
  let expectedPlazas = '';

  // NEO = 3 plazas, NEO S = 2 plazas (case insensitive)
  if (budgetModelName.toLowerCase().includes('neo s')) {
    expectedPlazas = '2';
  } else if (budgetModelName.toLowerCase().includes('neo')) {
    expectedPlazas = '3';
  }

  // Normalize strings for comparison (remove accents, convert to lowercase)
  const normalizeString = (str: string) => {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Check engine compatibility (vehicle.engine should match budget engine)
  const engineMatch = vehicleEngine.includes(budgetPower) || budgetEngine.includes(vehicleEngine);

  // Check color compatibility (must match exactly)
  const colorMatch = normalizeString(vehicleColor) === normalizeString(budgetColor);

  // Check transmission compatibility (normalized comparison)
  const transmissionMatch = normalizeString(vehicleTransmission) === normalizeString(budgetTransmission);

  // Check plazas compatibility (must match exactly)
  const plazasMatch = expectedPlazas !== '' && vehiclePlazas === expectedPlazas;

  if (import.meta.env.DEV) console.log('🔍 Vehicle compatibility check:', {
    vehicle: { engine: vehicleEngine, color: vehicleColor, transmission: vehicleTransmission, plazas: vehiclePlazas },
    budget: { engine: budgetEngine, power: budgetPower, color: budgetColor, transmission: budgetTransmission, model: budgetModelName, expectedPlazas },
    matches: { engineMatch, colorMatch, transmissionMatch, plazasMatch },
    normalized: {
      vehicleTransmission: normalizeString(vehicleTransmission),
      budgetTransmission: normalizeString(budgetTransmission)
    }
  });

  return engineMatch && colorMatch && transmissionMatch && plazasMatch;
};

const AssignVehicleDialog = ({
  open,
  onOpenChange,
  onAssign,
  vehicleId,
  currentProjectId,
  isLoading,
  useNewTable = false
}: AssignVehicleDialogProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(currentProjectId);

  // Get current vehicle data
  const { data: currentVehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId && open,
  });

  // Get projects with budget data for filtering
  const { data: allProjects } = useUnifiedProjectsList();

  // Get budget data for all projects to filter compatibility
  const { data: projectsWithBudgets } = useQuery({
    queryKey: ['projects-with-budgets'],
    queryFn: async () => {
      if (!allProjects?.length) return [];

      const projectsData = await Promise.all(
        allProjects.map(async (project) => {
          // Get primary budget for this project
          const { data: budget } = await supabase
            .from('NEW_Budget')
            .select(`
              *,
              engine_option:engine_options(*),
              exterior_color_option:exterior_color_options(*),
              model_option:model_options(*)
            `)
            .eq('project_id', project.id)
            .eq('is_primary', true)
            .maybeSingle();

          return {
            ...project,
            primary_budget: budget
          };
        })
      );

      return projectsData;
    },
    enabled: !!allProjects?.length && open,
  });

  // Filter projects based on compatibility and requirements
  const filteredProjects = useMemo(() => {
    if (!projectsWithBudgets || !currentVehicle) return [];

    return projectsWithBudgets.filter((project: ProjectWithBudget) => {
      // Must have a primary budget
      if (!project.primary_budget) return false;

      // Check vehicle compatibility
      const isCompatible = isVehicleCompatible(currentVehicle, project.primary_budget);

      // Allow current project even if not compatible (for unassigning)
      if (project.id === currentProjectId) return true;

      // Must not have a vehicle already assigned (unless it's the current project)
      const hasVehicle = project.vehicles !== null && project.vehicles !== undefined;
      if (hasVehicle && project.id !== currentProjectId) return false;

      return isCompatible;
    });
  }, [projectsWithBudgets, currentVehicle, currentProjectId]);

  const handleSubmit = () => {
    const projectToAssign = selectedProjectId === 'unassign' || !selectedProjectId ? undefined : selectedProjectId;
    if (import.meta.env.DEV) console.log('🔄 AssignVehicleDialog - handleSubmit:', { selectedProjectId, projectToAssign });
    onAssign(projectToAssign);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentProjectId ? 'Reasignar Vehículo' : 'Asignar Vehículo a Proyecto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Info Section */}
          {currentVehicle && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-sm">Características del Vehículo</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Código:</span>
                  <span className="ml-1 font-medium">{currentVehicle.vehicle_code}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Motor:</span>
                  <span className="ml-1 font-medium">{currentVehicle.engine || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Color:</span>
                  <span className="ml-1 font-medium">{currentVehicle.exterior_color || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Transmisión:</span>
                  <span className="ml-1 font-medium">{currentVehicle.transmission_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Plazas:</span>
                  <span className="ml-1 font-medium">{currentVehicle.plazas || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <Label htmlFor="project">Proyectos Compatibles</Label>
            <Select
              value={selectedProjectId || 'unassign'}
              onValueChange={(value) => setSelectedProjectId(value === 'unassign' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent
                position="item-aligned"
                className="w-[420px] max-h-[300px] bg-background border border-border shadow-lg z-50 overflow-hidden"
                sideOffset={4}
              >
                <SelectItem value="unassign">
                  {currentProjectId ? 'Desasignar vehículo' : 'Sin asignar'}
                </SelectItem>

                {filteredProjects?.length === 0 && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No hay proyectos compatibles con este vehículo
                  </div>
                )}

                {filteredProjects?.map((project: ProjectWithBudget) => {
                  const hasVehicle = project.vehicles !== null && project.vehicles !== undefined;
                  const isCurrentProject = project.id === currentProjectId;
                  const isCompatible = isVehicleCompatible(currentVehicle ?? null, project.primary_budget);

                  return (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                      disabled={hasVehicle && !isCurrentProject}
                      className="px-2 py-2 min-h-[60px]"
                    >
                      <div className="w-full flex flex-col space-y-1 overflow-hidden">
                        {/* Header with code and badge */}
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className="font-medium text-sm truncate text-left">
                            {project.code}
                          </span>
                          {isCompatible && (
                            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Client info */}
                        <div className="text-xs text-muted-foreground truncate text-left">
                          {project.clients?.name || 'Sin cliente'}
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-wrap gap-1">
                          {hasVehicle && !isCurrentProject && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-1 rounded">Ocupado</span>
                          )}
                          {isCurrentProject && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded">Actual</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Asignando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignVehicleDialog;
