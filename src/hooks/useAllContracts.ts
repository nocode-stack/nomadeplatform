import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const useAllContracts = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('all-contracts-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'NEW_Contracts',
                },
                () => {
                    logger.debug('Real-time update in NEW_Contracts detected, invalidating all-contracts query', { component: 'useAllContracts', action: 'realtime' });
                    queryClient.invalidateQueries({ queryKey: ['all-contracts'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: ['all-contracts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('NEW_Contracts')
                .select(`
                    *,
                    client:NEW_Clients(name),
                    budget:NEW_Budget(budget_code)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Error fetching all contracts', { component: 'useAllContracts', action: 'fetch', data: error });
                throw error;
            }

            return data || [];
        },
        staleTime: 10000,
        gcTime: 30000,
    });
};
