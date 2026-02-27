
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UpdateIncidentData {
  incident_date: string;
  workshop: string;
  description: string;
  photos?: string[];
}

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ incidentId, data }: { incidentId: string; data: UpdateIncidentData }) => {
      if (import.meta.env.DEV) console.log('🔄 Updating incident:', { incidentId, data });

      const { data: incident, error } = await supabase
        .from('incidents')
        .update({
          incident_date: data.incident_date,
          workshop: data.workshop,
          description: data.description,
          photos: data.photos || []
        })
        .eq('id', incidentId)
        .select(`
          *,
          project:projects (
            id,
            name,
            project_code,
            client_name,
            client_id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error updating incident:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Incident updated successfully:', incident);
      return incident;
    },
    onSuccess: () => {
      if (import.meta.env.DEV) console.log('✅ Incident update successful, invalidating queries...');

      // Invalidate all incident queries
      queryClient.invalidateQueries({ queryKey: ['incidents'] });

      toast({
        title: "✅ Incidencia actualizada",
        description: "La incidencia se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error updating incident:', error);
      toast({
        title: "❌ Error al actualizar incidencia",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};
