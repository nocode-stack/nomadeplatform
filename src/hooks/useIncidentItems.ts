import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IncidentItem {
  id: string;
  incident_id: string;
  description: string;
  category: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export const useIncidentItems = (incidentId: string) => {
  return useQuery({
    queryKey: ['incident-items', incidentId],
    queryFn: async (): Promise<IncidentItem[]> => {
      if (!incidentId) {
        return [];
      }

      const { data, error } = await supabase
        .from('NEW_Incident_Items')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching incident items:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!incidentId,
  });
};

export const useCreateIncidentItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { incident_id: string; description: string; category: string; priority?: string }) => {
      const { data: item, error } = await supabase
        .from('NEW_Incident_Items')
        .insert({
          incident_id: data.incident_id,
          description: data.description,
          category: data.category,
          priority: data.priority || 'medium'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating incident item:', error);
        throw error;
      }

      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['incident-items', item.incident_id] });
      toast({
        title: "Concepto agregado",
        description: "El concepto se ha agregado correctamente a la incidencia.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al agregar concepto",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useDeleteIncidentItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('NEW_Incident_Items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting incident item:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-items'] });
      toast({
        title: "Concepto eliminado",
        description: "El concepto se ha eliminado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar concepto",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
