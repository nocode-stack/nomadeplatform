import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProjectStatusUpdater = (projectId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const { error } = await supabase
        .from('NEW_Projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con proyectos para actualización instantánea
      queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['new-project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['unified-project', projectId] });
      }

      toast({
        title: "Estado actualizado",
        description: "El estado del proyecto se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });

  const updateManualStatus = (statusData: string | { status: string }) => {
    if (projectId) {
      const status = typeof statusData === 'string' ? statusData : statusData.status;
      updateStatusMutation.mutate({ projectId, status });
    }
  };

  const toggleManualMode = () => {
    // Placeholder para futuras implementaciones de modo manual
  };

  return {
    updateProjectStatus: updateStatusMutation.mutate,
    updateManualStatus,
    toggleManualMode,
    isUpdating: updateStatusMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isTogglingMode: false,
  };
};