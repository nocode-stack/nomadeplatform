import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TogglePrimaryParams {
    contractId: string;
    projectId: string;
    contractType: string;
    isPrimary: boolean;
}

export const useToggleContractPrimary = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ contractId, projectId, contractType, isPrimary }: TogglePrimaryParams) => {
            if (isPrimary) {
                // First, unmark all contracts of same project+type as not primary
                const { error: resetError } = await supabase
                    .from('NEW_Contracts')
                    .update({ is_primary: false })
                    .eq('project_id', projectId)
                    .eq('contract_type', contractType)
                    .eq('is_active', true);

                if (resetError) throw resetError;

                // Then mark the target contract as primary
                const { error: setError } = await supabase
                    .from('NEW_Contracts')
                    .update({ is_primary: true })
                    .eq('id', contractId);

                if (setError) throw setError;
            } else {
                // Just unmark this contract
                const { error } = await supabase
                    .from('NEW_Contracts')
                    .update({ is_primary: false })
                    .eq('id', contractId);

                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-contracts'] });
            queryClient.invalidateQueries({ queryKey: ['contractStatuses'] });
            queryClient.invalidateQueries({ queryKey: ['contract'] });
            toast({
                title: 'Contrato actualizado',
                description: 'Se ha actualizado el contrato principal.',
            });
        },
        onError: (error) => {
            console.error('Error toggling primary contract:', error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el contrato principal.',
                variant: 'destructive',
            });
        },
    });
};
