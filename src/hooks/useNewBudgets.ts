import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';

// Types para la nueva estructura
type NewBudget = Tables<'NEW_Budget'>;
type NewBudgetInsert = TablesInsert<'NEW_Budget'>;
type NewBudgetUpdate = TablesUpdate<'NEW_Budget'>;

type ModelOption = Tables<'model_options'>;
type EngineOption = Tables<'engine_options'>;
// exterior_color_options table removed
type InteriorColorOption = Tables<'interior_color_options'>;
type ElectricSystem = Tables<'NEW_Budget_Electric'>;
type BudgetPack = Tables<'NEW_Budget_Packs'>;

// Hook para obtener un presupuesto específico
export const useNewBudget = (budgetId: string) => {
  return useQuery({
    queryKey: ['new-budget', budgetId],
    queryFn: async () => {
      if (!budgetId) return null;

      const { data, error } = await supabase
        .from('NEW_Budget')
        .select(`
          *,
          engine_option:engine_options(*),
          model_option:model_options(*),
          interior_color:interior_color_options(*),
          pack:NEW_Budget_Packs(*),
          electric_system:NEW_Budget_Electric(*)
        `)
        .eq('id', budgetId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!budgetId,
  });
};

// Hook para obtener presupuestos de un cliente (anteriormente por proyecto)
export const useProjectBudgets = (clientId: string) => {
  return useQuery({
    queryKey: ['project-budgets', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Budget')
        .select(`
          *,
          engine_option:engine_options(name),
          model_option:model_options(name),
          pack:NEW_Budget_Packs(name),
          client:NEW_Clients!NEW_Budget_client_id_fkey(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Hook para obtener múltiples presupuestos (alias para compatibilidad)
export const useNewBudgets = (projectId?: string) => {
  return useQuery({
    queryKey: ['new-budgets', projectId],
    queryFn: async () => {
      let query = supabase
        .from('NEW_Budget')
        .select(`
          *,
          engine_option:engine_options(name),
          model_option:model_options(name),
          pack:NEW_Budget_Packs(name),
          client:NEW_Clients!NEW_Budget_client_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('client_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

// Hook para crear un presupuesto
export const useCreateNewBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetData: NewBudgetInsert) => {
      if (import.meta.env.DEV) console.log('🎯 Creando presupuesto:', budgetData);

      const { data, error } = await supabase
        .from('NEW_Budget')
        .insert(budgetData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al crear presupuesto:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Presupuesto creado:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['new-budget'] });
      queryClient.invalidateQueries({ queryKey: ['new-budgets'] });
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ['project-budgets', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['new-budgets', data.client_id] });
      }
    },
  });
};

// Hook para actualizar un presupuesto
export const useUpdateNewBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: NewBudgetUpdate & { id: string }) => {
      if (import.meta.env.DEV) console.log('🔄 Actualizando presupuesto:', id, updateData);

      const { data, error } = await supabase
        .from('NEW_Budget')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al actualizar presupuesto:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Presupuesto actualizado:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['new-budget', data.id] });

      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ['project-budgets', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['new-budgets', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['common-clients-list'] });

        if (data.is_primary) {
          if (import.meta.env.DEV) console.log('✅ Updated primary budget - client queries invalidated');
        }

        queryClient.invalidateQueries({ queryKey: ['contract', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['contractStatuses', data.client_id] });
      }
    },
  });
};

// Hook para eliminar un presupuesto
export const useDeleteNewBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('NEW_Budget')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
      return budgetId;
    },
    onSuccess: (budgetId, variables) => {
      // Invalidar todas las queries relacionadas con presupuestos
      queryClient.invalidateQueries({ queryKey: ['new-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['project-budgets'] });
      queryClient.removeQueries({ queryKey: ['new-budget', budgetId] });
    },
  });
};

// Hook para marcar un presupuesto como primario CON CONFIRMACIÓN
export const useSetPrimaryBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ budgetId, clientId, confirmed = false }: { budgetId: string; clientId: string; confirmed?: boolean }) => {
      if (import.meta.env.DEV) console.log('🎯 Setting primary budget:', budgetId, 'Confirmed:', confirmed);

      if (!confirmed) {
        throw new Error('CONFIRMATION_REQUIRED');
      }

      // First get the client_id for this budget (fallback just in case)
      const { data: budgetData } = await supabase
        .from('NEW_Budget')
        .select('client_id')
        .eq('id', budgetId)
        .single();

      const resolvedClientId = clientId || budgetData?.client_id;

      if (!resolvedClientId) {
        throw new Error('Budget not found or has no client');
      }

      // First, unmark all other budgets as primary for this client
      const { error: unmarkError } = await supabase
        .from('NEW_Budget')
        .update({ is_primary: false })
        .eq('client_id', resolvedClientId);

      if (unmarkError) {
        console.error('❌ Error unmarking other budgets:', unmarkError);
        throw unmarkError;
      }

      // Then mark this budget as primary (and reactivate if historical)
      const { data, error } = await supabase
        .from('NEW_Budget')
        .update({ is_primary: true, is_active: true })
        .eq('id', budgetId)
        .select(`
          *,
          model_option:model_options(name),
          engine_option:engine_options(name)
        `)
        .single();

      if (error) {
        console.error('❌ Error setting primary budget:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Primary budget set successfully:', data);
      return data;
    },
    onMutate: async ({ budgetId, clientId }) => {
      // Cancelar consultas en curso sobre esta clave para que no sobreescriban nuestra actualización optimista
      await queryClient.cancelQueries({ queryKey: ['project-budgets', clientId] });

      // Guardar el estado anterior por si hay que revertir
      const previousBudgets = queryClient.getQueryData(['project-budgets', clientId]);

      // Actualización optimista de la caché local
      queryClient.setQueryData(['project-budgets', clientId], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(b => ({
          ...b,
          is_primary: b.id === budgetId,
          is_active: b.id === budgetId ? true : b.is_active // el primario siempre se vuelve activo
        }));
      });

      return { previousBudgets };
    },
    onError: (error: any, { clientId }, context: any) => {
      // Si la mutación falla, restaurar la caché al estado anterior
      if (context?.previousBudgets) {
        queryClient.setQueryData(['project-budgets', clientId], context.previousBudgets);
      }

      if (error?.message !== 'CONFIRMATION_REQUIRED') {
        console.error('❌ Error setting primary budget:', error);
      }
    },
    onSuccess: (data, { clientId }) => {
      if (import.meta.env.DEV) console.log('🔄 Invalidating queries after primary budget change');

      // Invalidar queries de presupuestos
      queryClient.invalidateQueries({ queryKey: ['new-budgets'] });

      // Utilizar de preferencia el clientId de la mutación o del objeto retornado
      const activeClientId = clientId || data?.client_id;

      if (activeClientId) {
        // Invalidar todas las queries relacionadas con presupuestos del proyecto
        queryClient.invalidateQueries({ queryKey: ['new-budgets', activeClientId] });
        queryClient.invalidateQueries({ queryKey: ['project-budgets', activeClientId] });

        // Invalidar queries del proyecto y vehículo para actualizar header instantáneamente
        queryClient.invalidateQueries({ queryKey: ['new-clients', activeClientId] });
        queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
        queryClient.invalidateQueries({ queryKey: ['unified-project', activeClientId] });
        queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });

        // La tabla vehicles y budgets primaria también se ve afectada
        queryClient.invalidateQueries({ queryKey: ['primary-budget', activeClientId] });
        queryClient.invalidateQueries({ queryKey: ['vehicle', activeClientId] });
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });

        // Invalidar contratos ya que el total puede cambiar
        queryClient.invalidateQueries({ queryKey: ['contract', activeClientId] });
        queryClient.invalidateQueries({ queryKey: ['contractStatuses', activeClientId] });

        if (import.meta.env.DEV) console.log('✅ All queries invalidated for client:', activeClientId);
      }
    }
  });
};

// Hooks para las opciones del configurador
export const useModelOptions = () => {
  return useQuery({
    queryKey: ['model-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_options')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data as ModelOption[];
    },
  });
};

export const useEngineOptions = () => {
  return useQuery({
    queryKey: ['engine-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engine_options')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data as EngineOption[];
    },
  });
};

export const useExteriorColorOptions = () => {
  // exterior_color_options table was removed — return empty array
  return useQuery({
    queryKey: ['exterior-color-options'],
    queryFn: async () => {
      return [] as any[];
    },
  });
};

export const useInteriorColorOptions = () => {
  return useQuery({
    queryKey: ['interior-color-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interior_color_options')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data as InteriorColorOption[];
    },
  });
};

export const useNewBudgetPacks = () => {
  return useQuery({
    queryKey: ['new-budget-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Budget_Packs')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as BudgetPack[];
    },
  });
};

export const useElectricSystems = () => {
  return useQuery({
    queryKey: ['electric-systems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Budget_Electric')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data as ElectricSystem[];
    },
  });
};

export const useNewBudgetElectricSystems = () => {
  return useQuery({
    queryKey: ['new-budget-electric-systems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Budget_Electric')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data;
    },
  });
};

export const useNewBudgetAdditionalItems = () => {
  return useQuery({
    queryKey: ['new-budget-additional-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Budget_Additional_Items')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data;
    },
  });
};

// Hook para obtener los items de un presupuesto
export const useNewBudgetItems = (budgetId?: string) => {
  return useQuery({
    queryKey: ['new-budget-items', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];

      const { data, error } = await supabase
        .from('NEW_Budget_Items')
        .select('*')
        .eq('budget_id', budgetId)
        .order('order_index');

      if (error) throw error;
      return data || [];
    },
    enabled: !!budgetId,
  });
};