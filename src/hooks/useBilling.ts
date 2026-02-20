import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface BillingUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  nif?: string;
  type?: string;
}

export const useUpdateBilling = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: BillingUpdateData }) => {
      logger.debug('Actualizando datos de facturación', { component: 'useBilling', action: 'update', data: { clientId, data } });

      // Verificar si ya existe un registro de facturación
      const { data: existingBilling } = await supabase
        .from('NEW_Billing')
        .select('id')
        .eq('client_id', clientId)
        .single();

      if (existingBilling) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('NEW_Billing')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId);

        if (error) {
          logger.error('Error al actualizar facturación', { component: 'useBilling', action: 'update', data: error });
          throw error;
        }
      } else {
        // Crear nuevo registro
        const { error } = await supabase
          .from('NEW_Billing')
          .insert({
            client_id: clientId,
            ...data,
          });

        if (error) {
          logger.error('Error al crear facturación', { component: 'useBilling', action: 'create', data: error });
          throw error;
        }
      }

      logger.info('Datos de facturación actualizados correctamente', { component: 'useBilling', action: 'update' });
      return { clientId, data };
    },
    onSuccess: ({ clientId }) => {
      logger.debug('Success callback - invalidating queries for client', { component: 'useBilling', action: 'invalidate', data: { clientId } });

      // Invalidar queries relacionadas con facturación usando la nueva query key
      queryClient.invalidateQueries({ queryKey: ['billing-data', clientId] });
      queryClient.invalidateQueries({ queryKey: ['billing'] }); // Legacy support

      // Invalidar queries del proyecto para actualización instantánea
      queryClient.invalidateQueries({ queryKey: ['new-project'] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      queryClient.invalidateQueries({ queryKey: ['unified-project'] });
      queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });

      // Invalidar queries de contratos para actualización instantánea
      queryClient.invalidateQueries({ queryKey: ['contract'] });
      queryClient.invalidateQueries({ queryKey: ['contractStatuses'] });

      logger.debug('All queries invalidated successfully', { component: 'useBilling', action: 'invalidate' });

      toast({
        title: "Facturación actualizada",
        description: "Los datos de facturación se han actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      logger.error('Error en useUpdateBilling', { component: 'useBilling', action: 'mutation', data: error });
      toast({
        title: "Error al actualizar facturación",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};