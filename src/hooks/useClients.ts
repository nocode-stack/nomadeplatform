import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  dni?: string;
  address?: string;
  birthdate?: string;
  client_type?: string;
  is_hot_lead?: boolean;
}

export const useClients = () => {
  return useQuery({
    queryKey: ['common-clients-list'],
    queryFn: async () => {
      // @ts-ignore - Compilación profunda de tipos de Supabase
      // @ts-ignore - Deep Supabase type compilation
      const { data, error } = await supabase
        .from('NEW_Clients')
        .select(`
          *,
          NEW_Budget!NEW_Budget_client_id_fkey (
            *,
            model_option:model_options(name),
            engine_option:engine_options(name),
            interior_color_option:interior_color_options(name),
            pack:NEW_Budget_Packs(name),
            electric_system:NEW_Budget_Electric(name),
            NEW_Budget_Items (*)
          ),
          NEW_Billing (
            *
          )
        `)
        .or('is_active.is.null,is_active.eq.true')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching clients:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Detailed clients fetched:', data?.length);
      return data;
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: ClientUpdateData }) => {
      if (import.meta.env.DEV) console.log('🔄 Actualizando cliente:', { clientId, data });

      const { error } = await supabase
        .from('NEW_Clients')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) {
        console.error('❌ Error al actualizar cliente:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Cliente actualizado correctamente');
      return { clientId, data };
    },
    onSuccess: ({ clientId }) => {
      // Invalidar queries relacionadas con el cliente
      queryClient.invalidateQueries({ queryKey: ['new-project'] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      queryClient.invalidateQueries({ queryKey: ['unified-project'] });
      queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });
      queryClient.invalidateQueries({ queryKey: ['common-clients-list'] });

      // Invalidar queries de contratos para actualización instantánea
      queryClient.invalidateQueries({ queryKey: ['contract'] });
      queryClient.invalidateQueries({ queryKey: ['contractStatuses'] });

      // Invalidar billing del cliente
      queryClient.invalidateQueries({ queryKey: ['billing', clientId] });

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error en useUpdateClient:', error);
      toast({
        title: "Error al actualizar cliente",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!clientId) throw new Error("ID de cliente no proporcionado para la eliminación.");

      if (import.meta.env.DEV) console.log('🗑️ Iniciando proceso de "eliminación" (desactivación) de lead:', clientId);

      // 1. Desactivar contratos vinculados al cliente
      const { error: contractError } = await supabase
        .from('NEW_Contracts')
        .update({ is_active: false })
        .eq('client_id', clientId);

      if (contractError) {
        console.error('❌ Error al desactivar contratos:', contractError);
        throw new Error(`Error en contratos: ${contractError.message} (Código: ${contractError.code})`);
      }
      if (import.meta.env.DEV) console.log('✅ Contratos desactivados');

      // 2. Desactivar presupuestos vinculados al cliente
      // Usamos la relación directa client_id para mayor eficiencia.
      // Marcamos is_primary = false para evitar conflictos entre disparadores de la BD.
      if (import.meta.env.DEV) console.log('🔄 Desactivando presupuestos del cliente...');
      const { error: budgetError } = await supabase
        .from('NEW_Budget')
        .update({ is_active: false, is_primary: false })
        .eq('client_id', clientId);

      if (budgetError) {
        console.error('❌ Error al desactivar presupuestos:', budgetError);
        throw new Error(`Error en presupuestos: ${budgetError.message} (Código: ${budgetError.code})`);
      }
      if (import.meta.env.DEV) console.log('✅ Presupuestos desactivados');

      // 5. Desactivar el cliente
      const { error: clientError } = await supabase
        .from('NEW_Clients')
        .update({ is_active: false })
        .eq('id', clientId);

      if (clientError) {
        console.error('❌ Error al desactivar cliente:', clientError);
        throw new Error(`Error en cliente: ${clientError.message} (Código: ${clientError.code})`);
      }
      if (import.meta.env.DEV) console.log('✅ Cliente desactivado');

      return clientId;
    },
    onSuccess: () => {
      // Invalidar todas las queries que puedan mostrar este cliente
      queryClient.invalidateQueries({ queryKey: ['common-clients-list'] });
      queryClient.invalidateQueries({ queryKey: ['new-projects-list'] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      queryClient.invalidateQueries({ queryKey: ['contract'] });
      queryClient.invalidateQueries({ queryKey: ['contractStatuses'] });

      toast({
        title: "Lead eliminado",
        description: "El lead y toda su información vinculada se han desactivado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error en useDeleteLead:', error);
      toast({
        title: "Error al eliminar lead",
        description: error.message || "No se ha podido procesar la solicitud.",
        variant: "destructive",
      });
    }
  });
};

export const useToggleHotLead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, isHotLead }: { clientId: string; isHotLead: boolean }) => {
      const { error } = await supabase
        .from('NEW_Clients')
        .update({ is_hot_lead: isHotLead, updated_at: new Date().toISOString() })
        .eq('id', clientId);

      if (error) throw error;
      return { clientId, isHotLead };
    },
    onSuccess: ({ isHotLead }) => {
      queryClient.invalidateQueries({ queryKey: ['common-clients-list'] });
      toast({
        title: isHotLead ? '🔥 Hot Lead activado' : 'Hot Lead desactivado',
        description: isHotLead
          ? 'Este contacto ha sido marcado como Hot Lead.'
          : 'Se ha quitado la marca de Hot Lead.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar Hot Lead',
        description: error.message || 'Ha ocurrido un error inesperado',
        variant: 'destructive',
      });
    },
  });
};