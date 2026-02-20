import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PROJECT_QUERY_KEYS } from './useUnifiedProjects';

export const useBudgetMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markAsPrimaryMutation = useMutation({
    mutationFn: async ({ budgetId, projectId }: { budgetId: string; projectId: string }) => {
      if (import.meta.env.DEV) console.log('🔄 Marking budget as primary:', budgetId, 'for project:', projectId);

      // First, unmark all other budgets as primary for this project
      const { error: unmarkError } = await supabase
        .from('NEW_Budget')
        .update({ is_primary: false })
        .eq('project_id', projectId);

      if (unmarkError) {
        console.error('❌ Error unmarking other budgets:', unmarkError);
        throw unmarkError;
      }

      // Then mark this budget as primary
      const { error: markError } = await supabase
        .from('NEW_Budget')
        .update({ is_primary: true })
        .eq('id', budgetId);

      if (markError) {
        console.error('❌ Error marking budget as primary:', markError);
        throw markError;
      }

      if (import.meta.env.DEV) console.log('✅ Budget marked as primary successfully');
      return { budgetId, projectId };
    },
    onSuccess: ({ projectId }) => {
      // Invalidate all relevant queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['primary-budget', projectId] });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['budgets', projectId] });

      toast({
        title: "Presupuesto marcado como primario",
        description: "La información del proyecto se actualizará automáticamente.",
      });
    },
    onError: (error: Error) => {
      console.error('💥 Error marking budget as primary:', error);

      toast({
        title: "Error al marcar presupuesto como primario",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });

  return {
    markAsPrimary: markAsPrimaryMutation.mutate,
    isMarkingAsPrimary: markAsPrimaryMutation.isPending,
  };
};