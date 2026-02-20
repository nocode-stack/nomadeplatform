import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export const useAssignSlotToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, projectId }: {
      slotId: string;
      projectId?: string;
    }): Promise<void> => {
      logger.production.slotUpdate(slotId, { projectId });

      // Usar función RPC para operaciones atómicas
      const { error } = await supabase.rpc('assign_slot_to_project_atomic', {
        p_slot_id: slotId,
        p_project_id: projectId || null
      });

      if (error) {
        logger.error('Error in atomic slot assignment', { component: 'Production', action: 'slotAssign', data: error });
        throw error;
      }


    },
    onSuccess: (_, variables) => {
      // Invalidación optimizada
      queryClient.invalidateQueries({
        queryKey: ['available-production-slots'],
        exact: false
      });
      queryClient.invalidateQueries({
        queryKey: ['new-projects'],
        exact: false
      });

      const message = variables.projectId
        ? 'Slot de producción asignado exitosamente'
        : 'Slot de producción liberado exitosamente';

      toast.success(message);
    },
    onError: (error) => {
      logger.error('Error in slot assignment', { component: 'Production', action: 'slotAssign', data: error });
      toast.error('Error al gestionar la asignación del slot');
    },
  });
};