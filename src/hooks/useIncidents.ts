import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Incident {
  id: string;
  project_id: string;
  category: 'Mobiliario' | 'Sistema eléctrico' | 'Agua' | 'Gas' | 'Revestimiento' | 'Vehículo' | 'Filtraciones';
  incident_date: string;
  description: string;
  workshop: 'Nomade' | 'Caravaning Plaza' | 'Planeta Camper' | 'Al Milimetro';
  status_id?: string;
  photos: string[];
  repair_entry_date?: string;
  repair_exit_date?: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    project_code: string;
    client_name: string;
    client_id: string;
  };
}

export interface CreateIncidentData {
  project_id: string;
  incident_date: string;
  description: string;
  workshop: Incident['workshop'];
  photos?: string[];
  comments?: string;
  items?: Array<{
    description: string;
    category: string;
    priority: string;
  }>;
}

export const useIncidentsList = (projectId?: string) => {
  return useQuery({
    queryKey: projectId ? ['incidents', projectId] : ['incidents'],
    queryFn: async (): Promise<Incident[]> => {
      if (import.meta.env.DEV) console.log('📡 Fetching incidents from database...', projectId ? `for project: ${projectId}` : 'all incidents');

      let query = supabase
        .from('NEW_Incidents')
        .select(`
          *,
          project:NEW_Projects (
            id,
            project_code,
            client_name,
            client_id
          )
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching incidents:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Incidents fetched successfully:', data?.length || 0);

      // Procesar los datos con mejor manejo de errores
      const processedData = (data || []).map(item => {
        const processedItem = {
          ...item,
          category: item.category as Incident['category'],
          workshop: item.workshop as Incident['workshop'],
          photos: Array.isArray(item.photos) ? item.photos : [],
          project: item.project ? {
            id: item.project.id || '',
            name: item.project.project_code || '',
            project_code: item.project.project_code || '',
            client_name: item.project.client_name || '',
            client_id: item.project.client_id || ''
          } : undefined
        };

        return processedItem;
      });

      return processedData as Incident[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      if (import.meta.env.DEV) console.log('📝 Creating incident in database:', data);

      // Validar datos antes de enviar
      if (!data.project_id) {
        throw new Error('El ID del proyecto es requerido');
      }
      if (!data.description?.trim()) {
        throw new Error('La descripción es requerida');
      }
      if (!data.workshop) {
        throw new Error('El taller es requerido');
      }
      if (!data.incident_date) {
        throw new Error('La fecha de incidencia es requerida');
      }
      if (!data.items || data.items.length === 0) {
        throw new Error('Debe agregar al menos un concepto de reparación');
      }

      // Use the first item's category as the main incident category
      const mainCategory = data.items[0].category;

      const { data: incident, error } = await supabase
        .from('NEW_Incidents')
        .insert({
          project_id: data.project_id,
          category: mainCategory,
          incident_date: data.incident_date,
          description: data.description,
          workshop: data.workshop,
          photos: data.photos || []
        })
        .select(`
          *,
          project:NEW_Projects (
            id,
            project_code,
            client_name,
            client_id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creating incident:', error);
        throw new Error(`Error al crear la incidencia: ${error.message}`);
      }

      if (import.meta.env.DEV) console.log('✅ Incident created successfully:', incident);

      // Create incident items if provided
      if (data.items && data.items.length > 0) {
        if (import.meta.env.DEV) console.log('📝 Creating incident items...', data.items);

        const itemsToInsert = data.items.map(item => ({
          incident_id: incident.id,
          description: item.description,
          category: item.category,
          priority: item.priority || 'medium'
        }));

        const { error: itemsError } = await supabase
          .from('NEW_Incident_Items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('❌ Error creating incident items:', itemsError);
          // Don't throw here as the incident was created successfully
        } else {
          if (import.meta.env.DEV) console.log('✅ Incident items created successfully');
        }
      }

      return incident;
    },
    onSuccess: (incident) => {
      if (import.meta.env.DEV) console.log('✅ Incident creation successful, invalidating queries...');

      // Invalidar todas las consultas de incidencias
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incidents', incident.project_id] });

      // También invalidar las consultas del proyecto para actualizar contadores
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', incident.project_id] });

      toast({
        title: "✅ Incidencia reportada",
        description: "La incidencia ha sido enviada a producción para asignación de fechas.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error creating incident:', error);
      toast({
        title: "❌ Error al reportar incidencia",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};

export const useUpdateIncidentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ incidentId, status_id, repair_entry_date, repair_exit_date }: {
      incidentId: string;
      status_id?: string;
      repair_entry_date?: string;
      repair_exit_date?: string;
    }) => {
      if (import.meta.env.DEV) console.log('🔄 Updating incident status:', { incidentId, status_id, repair_entry_date, repair_exit_date });

      const updateData: Record<string, string> = {};

      if (status_id) {
        updateData.status_id = status_id;
      }

      // Solo incluir las fechas si se proporcionan (no undefined o string vacío)
      if (repair_entry_date && repair_entry_date.trim() !== '') {
        updateData.repair_entry_date = repair_entry_date;
      }
      if (repair_exit_date && repair_exit_date.trim() !== '') {
        updateData.repair_exit_date = repair_exit_date;
      }

      if (import.meta.env.DEV) console.log('📝 Update data:', updateData);

      const { data, error } = await supabase
        .from('NEW_Incidents')
        .update(updateData)
        .eq('id', incidentId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating incident:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Incident updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la incidencia se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error in mutation:', error);
      toast({
        title: "Error al actualizar estado",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      if (import.meta.env.DEV) console.log('🗑️ Deleting incident:', incidentId);

      // First delete incident items
      const { error: itemsError } = await supabase
        .from('NEW_Incident_Items')
        .delete()
        .eq('incident_id', incidentId);

      if (itemsError) {
        console.error('❌ Error deleting incident items:', itemsError);
        throw new Error(`Error al eliminar los conceptos de la incidencia: ${itemsError.message}`);
      }

      // Then delete the incident
      const { error } = await supabase
        .from('NEW_Incidents')
        .delete()
        .eq('id', incidentId);

      if (error) {
        console.error('❌ Error deleting incident:', error);
        throw new Error(`Error al eliminar la incidencia: ${error.message}`);
      }

      if (import.meta.env.DEV) console.log('✅ Incident deleted successfully');
      return incidentId;
    },
    onSuccess: (deletedId) => {
      if (import.meta.env.DEV) console.log('✅ Incident deletion successful, invalidating queries...');

      // Invalidate all incident queries
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      toast({
        title: "✅ Incidencia eliminada",
        description: "La incidencia ha sido eliminada permanentemente de la base de datos.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error deleting incident:', error);
      toast({
        title: "❌ Error al eliminar incidencia",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};
