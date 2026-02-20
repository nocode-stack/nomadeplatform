import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UnifiedProject, DatabaseProject, DatabaseClient } from '../types/database';

interface PhaseProgress {
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  NEW_Project_Phase_Template?: {
    phase_name: string;
    group: string;
    phase_order: number;
  } | null;
  [key: string]: unknown;
}

interface BudgetWithRelations {
  engine_option?: { name?: string; power?: string; transmission?: string } | null;
  model_option?: { name?: string } | null;
  exterior_color_option?: { name?: string } | null;
  pack?: { name?: string } | null;
  electric_system?: { name?: string } | null;
  [key: string]: unknown;
}

// Centralized query keys
export const PROJECT_QUERY_KEYS = {
  all: ['unified-projects'] as const,
  lists: () => [...PROJECT_QUERY_KEYS.all, 'list'] as const,
  list: (filter: string) => [...PROJECT_QUERY_KEYS.all, 'list', filter] as const,
  details: () => [...PROJECT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROJECT_QUERY_KEYS.all, 'detail', id] as const,
};

// Hook para obtener la lista de proyectos unificados - UPDATED TO USE BUDGET DATA
export const useUnifiedProjectsList = () => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.lists(),
    queryFn: async (): Promise<UnifiedProject[]> => {
      if (import.meta.env.DEV) console.log('🔍 Fetching unified projects list with budget data...');

      // UPDATED: Use NEW_Projects as primary source
      const { data, error } = await supabase
        .from('NEW_Projects')
        .select(`
          *,
          NEW_Clients(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching NEW_Projects:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ NEW_Projects fetched:', data?.length || 0);
      if (import.meta.env.DEV) console.log('🔍 Sample NEW_Project:', data?.[0]);

      const projectIds = (data || []).map(p => p.id);

      // Batch query 1: All phases for all projects at once
      const { data: allPhases } = projectIds.length > 0
        ? await supabase
          .from('NEW_Project_Phase_Progress')
          .select(`*, NEW_Project_Phase_Template(phase_name, group, phase_order)`)
          .in('project_id', projectIds)
          .order('NEW_Project_Phase_Template(phase_order)')
        : { data: [] };

      // Batch query 2: All vehicles for all projects at once
      const { data: allVehicles } = projectIds.length > 0
        ? await supabase
          .from('NEW_Vehicles')
          .select('*')
          .in('project_id', projectIds)
        : { data: [] };

      // Batch query 3: All primary budgets for all projects at once
      const { data: allBudgets } = projectIds.length > 0
        ? await supabase
          .from('NEW_Budget')
          .select(`*, model_option:model_options(*)`)
          .in('project_id', projectIds)
          .eq('is_primary', true)
        : { data: [] };

      // Index by project_id for O(1) lookups
      const phasesByProject = new Map<string, typeof allPhases>();
      (allPhases || []).forEach(phase => {
        const list = phasesByProject.get(phase.project_id) || [];
        list.push(phase);
        phasesByProject.set(phase.project_id, list);
      });

      const vehiclesByProject = new Map<string, (typeof allVehicles extends (infer T)[] | null ? T : never)>();
      (allVehicles || []).forEach(v => vehiclesByProject.set(v.project_id, v));

      const budgetsByProject = new Map<string, (typeof allBudgets extends (infer T)[] | null ? T : never)>();
      (allBudgets || []).forEach(b => {
        if (b.project_id && !budgetsByProject.has(b.project_id)) {
          budgetsByProject.set(b.project_id, b);
        }
      });

      // Transform data using the pre-fetched maps (no more individual queries)
      const projectsWithDetails = (data || []).map((newProject) => {
        const clientData = newProject.NEW_Clients;
        const phasesData = phasesByProject.get(newProject.id) || [];
        const vehicleData = vehiclesByProject.get(newProject.id) || null;
        const budgetData = budgetsByProject.get(newProject.id) || null;

        // Determine current phase from phases
        let currentPhase = null;
        if (phasesData.length > 0) {
          const inProgressPhase = phasesData.find(p => p.status === 'in_progress');
          const completedPhases = phasesData.filter(p => p.status === 'completed');

          if (inProgressPhase) {
            currentPhase = inProgressPhase.NEW_Project_Phase_Template?.group ?? null;
          } else if (completedPhases.length > 0) {
            const lastCompletedPhase = completedPhases[completedPhases.length - 1];
            currentPhase = lastCompletedPhase.NEW_Project_Phase_Template?.group ?? null;
          }
        }

        return {
          id: newProject.id,
          code: clientData?.client_status === 'prospect'
            ? (clientData?.client_code || null)
            : (newProject.project_code || null),
          name: 'Proyecto sin nombre',
          model: (budgetData as BudgetWithRelations | null)?.model_option?.name || 'Por definir',
          power: (vehicleData as Record<string, unknown> | null)?.engine as string || 'Por definir',
          interior_color: 'Por definir',
          exterior_color: (vehicleData as Record<string, unknown> | null)?.exterior_color as string || 'Por definir',
          pack: 'Por definir',
          electric_system: 'Por definir',
          extras: 'Por definir',
          client_id: newProject.client_id,
          comercial: newProject.comercial,
          client_name: clientData?.name || 'Sin cliente',
          client_email: clientData?.email || null,
          client_phone: clientData?.phone || null,
          status: newProject.status || 'prospect',
          progress: phasesData.length > 0
            ? Math.round((phasesData.filter(p => p.status === 'completed').length / phasesData.length) * 100)
            : 0,
          currentPhase: currentPhase,
          priority: 'medium' as const,
          created_at: newProject.created_at,
          updated_at: newProject.updated_at || newProject.created_at,
          delivery_date: newProject.delivery_date,
          start_date: newProject.start_date,
          vehicle_id: newProject.vehicle_id || null,
          production_code_id: null,
          vehicles: vehicleData,
          new_clients: clientData,
          clients: clientData,
          new_projects: newProject,
          projects: null
        };
      });

      return projectsWithDetails as unknown as UnifiedProject[];
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

// Hook para obtener un proyecto específico - UPDATED TO USE NEW_Projects
export const useUnifiedProject = (projectId: string) => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.detail(projectId),
    queryFn: async (): Promise<UnifiedProject> => {
      if (import.meta.env.DEV) console.log('🔍 Fetching project from NEW_Projects:', projectId);

      // UPDATED: Use NEW_Projects as primary source
      const { data: newProjectData, error } = await supabase
        .from('NEW_Projects')
        .select(`
          *,
          NEW_Clients(*)
        `)
        .eq('id', projectId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching NEW_Project:', error);
        throw error;
      }

      if (!newProjectData) {
        throw new Error('Project not found');
      }

      const clientData = newProjectData.NEW_Clients;

      // Get current project phases to determine current phase only (not status)
      const { data: phasesData } = await supabase
        .from('NEW_Project_Phase_Progress')
        .select(`
          *,
          NEW_Project_Phase_Template (
            phase_name,
            group,
            phase_order
          )
        `)
        .eq('project_id', projectId)
        .order('NEW_Project_Phase_Template(phase_order)');

      // Determine current phase (not status) from phases
      let currentPhase = null;
      if (phasesData && phasesData.length > 0) {
        // Find the most advanced phase that is completed or in progress
        const inProgressPhase = phasesData.find(p => p.status === 'in_progress');
        const completedPhases = phasesData.filter(p => p.status === 'completed');

        if (inProgressPhase) {
          currentPhase = inProgressPhase.NEW_Project_Phase_Template?.group;
        } else if (completedPhases.length > 0) {
          // Get the last completed phase
          const lastCompletedPhase = completedPhases[completedPhases.length - 1];
          currentPhase = lastCompletedPhase.NEW_Project_Phase_Template?.group;
        }
      }

      // Temporarily disable legacy project data queries
      let projectData = null;
      if (import.meta.env.DEV) console.log('🔍 Using NEW_Projects as primary source for detail view');
      if (import.meta.env.DEV) console.log('📊 Current phase from NEW system:', currentPhase);
      if (import.meta.env.DEV) console.log('📊 Project status from DB:', newProjectData.status);

      if (import.meta.env.DEV) console.log('✅ NEW_Project data:', newProjectData);
      if (import.meta.env.DEV) console.log('👤 Client data:', clientData);
      if (import.meta.env.DEV) console.log('📊 Project data:', projectData);

      // Get vehicle data from NEW_Vehicles based on project assignment
      let vehicleData = null;
      if (import.meta.env.DEV) console.log('🔍 Checking for NEW_Vehicles assigned to project:', projectId);

      const { data: newVehicleData, error: vError } = await supabase
        .from('NEW_Vehicles')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (vError) {
        console.error('❌ Error fetching NEW_Vehicle:', vError);
      } else if (newVehicleData) {
        vehicleData = newVehicleData;
        if (import.meta.env.DEV) console.log('✅ NEW_Vehicle data found:', vehicleData);
      } else {
        if (import.meta.env.DEV) console.log('⚠️ No NEW_Vehicle assigned to this project');
      }

      // Get production slot data if slot_id exists in NEW_Projects
      let productionSlot = null;
      if (newProjectData?.slot_id) {
        const { data: slotData } = await supabase
          .from('NEW_Production_Schedule')
          .select('*')
          .eq('id', newProjectData.slot_id)
          .maybeSingle();

        productionSlot = slotData;
      }

      // Get PRIMARY budget data from the new budget system
      let budgetData = null;
      const { data: budgetList } = await supabase
        .from('NEW_Budget')
        .select(`
          *,
          engine_option:engine_options(*),
          model_option:model_options(*),
          exterior_color_option:exterior_color_options(*),
          pack:NEW_Budget_Packs(*),
          electric_system:NEW_Budget_Electric(*)
        `)
        .eq('project_id', projectId)
        .eq('is_primary', true)
        .maybeSingle();

      if (budgetList) {
        budgetData = budgetList;
        if (import.meta.env.DEV) console.log('✅ Primary budget data found:', budgetData);
      } else {
        // Fallback to latest budget if no primary budget
        const { data: fallbackBudget } = await supabase
          .from('NEW_Budget')
          .select(`
            *,
            engine_option:engine_options(*),
            model_option:model_options(*),
            exterior_color_option:exterior_color_options(*),
            pack:NEW_Budget_Packs(*),
            electric_system:NEW_Budget_Electric(*)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fallbackBudget && fallbackBudget.length > 0) {
          budgetData = fallbackBudget[0];
          if (import.meta.env.DEV) console.log('⚠️ No primary budget, using latest:', budgetData);
        }
      }

      // Extract specs from budget data with proper power + transmission formatting
      const getBudgetSpec = (budget: BudgetWithRelations | null) => {
        if (!budget) return {};

        // Construct engine spec with power and transmission
        let engineSpec = 'Por definir';
        if (budget.engine_option) {
          const parts = [];
          if (budget.engine_option.power) parts.push(budget.engine_option.power);
          if (budget.engine_option.transmission) parts.push(budget.engine_option.transmission);
          engineSpec = parts.length > 0 ? parts.join(' ') : budget.engine_option.name || 'Por definir';
        }

        return {
          model: budget.model_option?.name || 'Por definir',
          power: engineSpec,
          engine: engineSpec,
          exteriorColor: budget.exterior_color_option?.name || 'Por definir',
          pack: budget.pack?.name || 'Por definir',
          electricSystem: budget.electric_system?.name || 'Por definir'
        };
      };

      // Transform data with NEW_Projects as primary source
      const transformedData = {
        // Use NEW_Projects as primary data source
        id: newProjectData.id,
        code: clientData?.client_status === 'prospect'
          ? (clientData?.client_code || null)
          : (newProjectData.project_code || null),
        name: projectData?.name || 'Proyecto sin nombre',
        // Prioritize primary budget data over vehicle data
        model: getBudgetSpec(budgetData).model,
        power: getBudgetSpec(budgetData).power,
        interior_color: 'Por definir', // No disponible en nueva estructura
        exterior_color: getBudgetSpec(budgetData).exteriorColor !== 'Por definir'
          ? getBudgetSpec(budgetData).exteriorColor
          : vehicleData?.exterior_color || 'Por definir',
        pack: getBudgetSpec(budgetData).pack,
        electric_system: getBudgetSpec(budgetData).electricSystem,
        extras: 'Por definir', // Los extras están en NEW_Budget_Items
        client_id: newProjectData.client_id,
        comercial: newProjectData.comercial,
        // Client information from NEW_Clients
        client_name: clientData?.name || 'Sin cliente',
        client_email: clientData?.email || null,
        client_phone: clientData?.phone || null,
        // FIXED: Use database status directly instead of recalculating
        status: newProjectData.status || 'prospect',
        progress: phasesData ? Math.round((phasesData.filter(p => p.status === 'completed').length / phasesData.length) * 100) : 0,
        currentPhase: currentPhase,
        priority: 'medium' as const,
        // Dates
        created_at: newProjectData.created_at,
        updated_at: newProjectData.updated_at || newProjectData.created_at,
        delivery_date: newProjectData.delivery_date,
        start_date: newProjectData.start_date,
        // Related data
        vehicle_id: newProjectData.vehicle_id || null,
        production_code_id: projectData?.production_code_id || null,
        production_slot: productionSlot,
        vehicles: vehicleData,
        // Keep client data with both mappings for compatibility
        new_clients: clientData,
        clients: clientData,
        // Add project phases if they exist
        project_phase_progress: projectData?.project_phase_progress || [],
        // Add NEW_Projects, project data, and primary budget for reference
        new_projects: newProjectData,
        projects: projectData,
        primary_budget: budgetData
      };

      if (import.meta.env.DEV) console.log('✅ Final transformed project data from NEW_Projects:', transformedData);
      if (import.meta.env.DEV) console.log('👤 Final client data:', clientData);
      return transformedData as unknown as UnifiedProject;
    },
    enabled: !!projectId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });
};

// Import the update project hook from separate file
// export { useUpdateProject } from './useUpdateProject'; // Deshabilitado temporalmente

// Hook para fases de proyecto (actualizado para aceptar projectId)
export const useProjectPhases = (projectId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const phasesQuery = useQuery({
    queryKey: [...PROJECT_QUERY_KEYS.all, 'phases', projectId],
    queryFn: async () => {
      if (import.meta.env.DEV) console.log('🔍 Fetching NEW project phases for:', projectId);

      const { data, error } = await supabase
        .from('NEW_Project_Phase_Progress')
        .select(`
          *,
          NEW_Project_Phase_Template (
            *
          )
        `)
        .eq('project_id', projectId)
        .order('NEW_Project_Phase_Template(phase_order)');

      if (error) {
        console.error('❌ Error fetching phases:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Project phases fetched:', data?.length || 0);
      return data || [];
    },
    enabled: !!projectId,
    staleTime: 1000 * 10, // 10 seconds for faster updates
  });

  // Real-time subscription for phase updates
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('project-phases-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Project_Phase_Progress',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          if (import.meta.env.DEV) console.log('🔄 Real-time phase update detected, invalidating queries');
          queryClient.invalidateQueries({ queryKey: [...PROJECT_QUERY_KEYS.all, 'phases', projectId] });
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Projects',
          filter: `id=eq.${projectId}`
        },
        () => {
          if (import.meta.env.DEV) console.log('🔄 Real-time project update detected, invalidating queries');
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Budget',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          if (import.meta.env.DEV) console.log('🔄 Real-time budget update detected, invalidating project queries');
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
          queryClient.invalidateQueries({ queryKey: ['primary-budget', projectId] });
          queryClient.invalidateQueries({ queryKey: ['vehicle', projectId] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.invalidateQueries({ queryKey: ['contract', projectId] });
          queryClient.invalidateQueries({ queryKey: ['contractStatuses', projectId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Vehicles',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          if (import.meta.env.DEV) console.log('🔄 Real-time vehicle update detected, invalidating project queries');
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
          queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ phaseId, status }: { phaseId: string; status: string }) => {
      if (import.meta.env.DEV) console.log('🔄 Updating NEW phase:', phaseId, 'status:', status);

      const updateData: Record<string, string> = { status };

      if (status === 'completed') {
        updateData.end_date = new Date().toISOString().split('T')[0];
      } else if (status === 'in_progress') {
        updateData.start_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('NEW_Project_Phase_Progress')
        .update(updateData)
        .eq('id', phaseId);

      if (error) {
        console.error('❌ Error updating phase:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Phase updated successfully');
    },
    onSuccess: () => {
      // Invalidar queries de fases y proyecto para actualización instantánea
      queryClient.invalidateQueries({ queryKey: [...PROJECT_QUERY_KEYS.all, 'phases', projectId] });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });

      // También invalidar queries específicas del proyecto para header
      queryClient.invalidateQueries({ queryKey: ['new-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['unified-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });

      // NUEVO: Invalidar production slots para actualizar planificación automáticamente
      queryClient.invalidateQueries({ queryKey: ['production-slots'] });

      toast({
        title: "Fase actualizada",
        description: "El estado de la fase se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error('💥 Error updating phase:', error);

      toast({
        title: "Error al actualizar fase",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });

  return {
    phases: phasesQuery.data || [],
    isLoading: phasesQuery.isLoading,
    error: phasesQuery.error,
    updatePhase: updatePhaseMutation.mutate,
    isUpdating: updatePhaseMutation.isPending,
  };
};

// Export for backward compatibility
export const useProjectsList = useUnifiedProjectsList;
export const useProject = useUnifiedProject;
