import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/** Hook for fetching and updating project phases */
export const useProjectPhases = (projectId: string) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const phasesQuery = useQuery({
        queryKey: ['new-project-phases', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('NEW_Project_Phase_Progress')
                .select(`
          *,
          NEW_Project_Phase_Template(*)
        `)
                .eq('project_id', projectId)
                .order('NEW_Project_Phase_Template(phase_order)');

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });

    const updatePhaseMutation = useMutation({
        mutationFn: async ({ phaseId, status }: { phaseId: string; status: string }) => {
            const updateData: Record<string, string> = { status };
            if (status === 'completed') updateData.end_date = new Date().toISOString().split('T')[0];
            else if (status === 'in_progress') updateData.start_date = new Date().toISOString().split('T')[0];

            const { error } = await supabase.from('NEW_Project_Phase_Progress').update(updateData).eq('id', phaseId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['new-project-phases', projectId] });
            queryClient.invalidateQueries({ queryKey: ['new-project', projectId] });
            toast({ title: "Fase actualizada", description: "Estado cambiado correctamente." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
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
