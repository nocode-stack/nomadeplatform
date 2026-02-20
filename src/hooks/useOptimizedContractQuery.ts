import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Hook optimizado para obtener el estado de los contratos con caché inteligente y tiempo real
export const useOptimizedContractQuery = (projectId: string, budgetId?: string) => {
  const queryClient = useQueryClient();

  // Real-time subscription for contract updates
  useEffect(() => {
    if (!projectId) return;

    let filterString = `project_id=eq.${projectId}`;
    if (budgetId) filterString += `&budget_id=eq.${budgetId}`;

    const channel = supabase
      .channel('contracts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Contracts',
          filter: filterString
        },
        () => {
          logger.debug('Real-time contract update', { component: 'Contract', action: 'realtime' });
          queryClient.invalidateQueries({ queryKey: ['contractStatuses', projectId] });
          queryClient.invalidateQueries({ queryKey: ['contract', projectId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Clients'
        },
        () => {
          logger.debug('Client data updated', { component: 'Contract', action: 'realtime' });
          queryClient.invalidateQueries({ queryKey: ['contract', projectId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Billing'
        },
        () => {
          logger.debug('Billing data updated', { component: 'Contract', action: 'realtime' });
          queryClient.invalidateQueries({ queryKey: ['contract', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, budgetId, queryClient]);

  return useQuery({
    queryKey: ['contractStatuses', projectId, budgetId],
    queryFn: async () => {
      let query = supabase
        .from('NEW_Contracts')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_latest', true)
        .eq('is_active', true);

      if (budgetId) {
        query = query.eq('budget_id', budgetId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching contract statuses', { component: 'Contract', action: 'fetch', data: error });
        return [];
      }

      return data || [];
    },
    enabled: !!projectId,
    staleTime: 5000, // Reducido a 5 segundos para mayor velocidad
    gcTime: 15000, // Reducido a 15 segundos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
};

// Hook optimizado para obtener un contrato específico
export const useOptimizedContractDetail = (projectId: string, contractType: string) => {
  const queryClient = useQueryClient();

  // Real-time subscription for specific contract updates
  useEffect(() => {
    if (!projectId || !contractType) return;

    const channel = supabase
      .channel(`contract-detail-${contractType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Contracts',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          logger.debug(`Real-time contract detail update for ${contractType}`, { component: 'Contract', action: 'realtime' });
          queryClient.invalidateQueries({ queryKey: ['contract', projectId, contractType] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, contractType, queryClient]);
  return useQuery({
    queryKey: ['contract', projectId, contractType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Contracts')
        .select('*')
        .eq('project_id', projectId)
        .eq('contract_type', contractType)
        .eq('is_latest', true)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching contract detail', { component: 'Contract', action: 'fetch', data: error });
        return null;
      }

      return data;
    },
    enabled: !!projectId && !!contractType,
    staleTime: 3000, // 3 segundos
    gcTime: 8000, // 8 segundos
    refetchOnWindowFocus: false,
    retry: 1,
  });
};