import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

// New incident interfaces based on NEW_Incidents table structure
export interface IncidentStatus {
  id: string;
  status_code: string;
  label: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncidentItem {
  id: string;
  incident_id: string;
  description: string;
  category: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface NewIncident {
  id: string;
  project_id: string;
  category: string;
  incident_date: string;
  description: string;
  workshop: string;
  photos: string[];
  repair_entry_date?: string;
  repair_exit_date?: string;
  status_id?: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
  // Relations
  status?: IncidentStatus;
  items?: IncidentItem[];
  project?: {
    id: string;
    name: string; // This will now contain project_code
    project_code: string;
    client_name: string;
    client_id: string;
    delivery_date?: string;
    client?: {
      id: string;
      name: string;
      client_code: string;
      email: string;
      phone: string;
    };
    vehicle?: {
      id: string;
      engine: string;
      transmission_type: string;
      warranty_status: string;
      vehicle_code: string;
      plazas: string;
    };
    budget?: Array<{
      id: string;
      is_primary: boolean;
      model_option?: {
        id: string;
        name: string;
      };
      engine_option?: {
        id: string;
        name: string;
        power: string;
        transmission: string;
      };
      exterior_color?: {
        id: string;
        name: string;
      };
    }>;
  };
}

export interface CreateNewIncidentData {
  project_id: string;
  incident_date: string;
  description: string;
  workshop: string;
  photos?: string[];
  comments?: string;
  items?: Array<{
    description: string;
    category: string;
    priority: string;
  }>;
}

// Hook for fetching incident statuses
export const useIncidentStatuses = () => {
  return useQuery({
    queryKey: ['incident-statuses'],
    queryFn: async (): Promise<IncidentStatus[]> => {
      logger.debug('Fetching incident statuses', { component: 'Incident', action: 'fetchStatuses' });

      const { data, error } = await supabase
        .from('NEW_Incident_Status')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('❌ Error fetching incident statuses:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Hook for fetching new incidents
export const useNewIncidentsList = (projectId?: string) => {
  return useQuery({
    queryKey: projectId ? ['new-incidents', projectId] : ['new-incidents'],
    queryFn: async (): Promise<NewIncident[]> => {
      logger.debug('Fetching new incidents', { component: 'Incident', data: { projectId: projectId || 'all' } });

      let query = supabase
        .from('NEW_Incidents')
        .select(`
          *,
          status:NEW_Incident_Status(*),
          items:NEW_Incident_Items(*),
            project:NEW_Projects (
              id,
              project_code,
              client_name,
              client_id,
              vehicle_id,
              delivery_date,
              client:NEW_Clients (
                id,
                name,
                client_code,
                email,
                phone
              ),
              vehicle:NEW_Vehicles!NEW_Projects_vehicle_id_fkey (
                id,
                engine,
                transmission_type,
                warranty_status,
                vehicle_code,
                plazas
              ),
              budget:NEW_Budget!NEW_Budget_project_id_fkey (
                id,
                is_primary,
                model_option:model_options (
                  id,
                  name
                ),
                engine_option:engine_options (
                  id,
                  name,
                  power,
                  transmission
                )
              )
            )
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching new incidents:', error);
        throw error;
      }

      logger.debug('New incidents fetched', { component: 'Incident', data: { count: data?.length || 0 } });

      // Process the data
      const processedData = (data || []).map(item => ({
        ...item,
        photos: Array.isArray(item.photos) ? item.photos : [],
        project: item.project ? {
          id: item.project.id || '',
          name: item.project.project_code || '',
          project_code: item.project.project_code || '',
          client_name: item.project.client_name || '',
          client_id: item.project.client_id || '',
          delivery_date: item.project.delivery_date || undefined,
          client: item.project.client ? {
            id: item.project.client.id || '',
            name: item.project.client.name || '',
            client_code: item.project.client.client_code || '',
            email: item.project.client.email || '',
            phone: item.project.client.phone || ''
          } : undefined,
          vehicle: item.project.vehicle ? {
            id: item.project.vehicle.id || '',
            engine: item.project.vehicle.engine || '',
            transmission_type: item.project.vehicle.transmission_type || '',
            warranty_status: item.project.vehicle.warranty_status || '',
            vehicle_code: item.project.vehicle.vehicle_code || '',
            plazas: item.project.vehicle.plazas || ''
          } : undefined,
          budget: item.project.budget ? item.project.budget.map((budget: { id?: string; is_primary?: boolean | null; model_option?: { id?: string; name?: string } | null; engine_option?: { id?: string; name?: string; power?: string; transmission?: string } | null; exterior_color?: { id?: string; name?: string } | null }) => ({
            id: budget.id || '',
            is_primary: budget.is_primary || false,
            model_option: budget.model_option ? {
              id: budget.model_option.id || '',
              name: budget.model_option.name || ''
            } : undefined,
            engine_option: budget.engine_option ? {
              id: budget.engine_option.id || '',
              name: budget.engine_option.name || '',
              power: budget.engine_option.power || '',
              transmission: budget.engine_option.transmission || ''
            } : undefined,
            exterior_color: budget.exterior_color ? {
              id: budget.exterior_color.id || '',
              name: budget.exterior_color.name || ''
            } : undefined
          })) : undefined
        } : undefined
      }));

      return processedData as NewIncident[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

// Hook for creating new incidents
export const useCreateNewIncident = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateNewIncidentData) => {
      logger.incident.create(data);

      // Validation
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

      // Get the default status (reportada)
      const { data: defaultStatus } = await supabase
        .from('NEW_Incident_Status')
        .select('id')
        .eq('status_code', 'reportada')
        .single();

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
          photos: data.photos || [],
          status_id: defaultStatus?.id
        })
        .select(`
          *,
          status:NEW_Incident_Status(*),
          project:NEW_Projects (
            id,
            project_code,
            client_name,
            client_id,
            client:NEW_Clients (
              id,
              name,
              client_code,
              email,
              phone
            )
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creating new incident:', error);
        throw new Error(`Error al crear la incidencia: ${error.message}`);
      }

      logger.debug('New incident created', { component: 'Incident', data: { id: incident.id } });

      // Create incident items
      if (data.items && data.items.length > 0) {
        logger.debug('Creating incident items', { component: 'Incident', data: { count: data.items.length } });

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
          logger.debug('Incident items created', { component: 'Incident' });
        }
      }

      return incident;
    },
    onSuccess: async (incident) => {
      logger.debug('Incident creation successful, invalidating queries', { component: 'Incident' });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['new-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['new-incidents', incident.project_id] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      queryClient.invalidateQueries({ queryKey: ['unified-project', incident.project_id] });

      // Send n8n notification
      try {
        logger.debug('Sending n8n notification', { component: 'Incident' });
        await supabase.functions.invoke('n8n-notification', {
          body: { incident }
        });
      } catch (error) {
        console.error('❌ Error sending n8n notification:', error);
        // Don't show error to user as incident was created successfully
      }

      toast({
        title: "✅ Incidencia reportada",
        description: "La incidencia ha sido enviada a producción para asignación de fechas.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error creating new incident:', error);
      toast({
        title: "❌ Error al reportar incidencia",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};

// Hook for updating incident status
export const useUpdateNewIncidentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ incidentId, statusId, repair_entry_date, repair_exit_date }: {
      incidentId: string;
      statusId: string;
      repair_entry_date?: string;
      repair_exit_date?: string;
    }) => {
      logger.debug('Updating incident status', { component: 'Incident', data: { incidentId, statusId } });

      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      logger.debug('Auth session check', { component: 'Incident', data: { authenticated: !!session?.user } });

      if (!session?.user) {
        throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
      }

      const updateData: Record<string, string> = {
        status_id: statusId,
        updated_at: new Date().toISOString()
      };

      // Include dates if provided
      if (repair_entry_date && repair_entry_date.trim() !== '') {
        updateData.repair_entry_date = repair_entry_date;
        logger.debug('Adding repair entry date', { component: 'Incident', data: { repair_entry_date } });
      }
      if (repair_exit_date && repair_exit_date.trim() !== '') {
        updateData.repair_exit_date = repair_exit_date;
        logger.debug('Adding repair exit date', { component: 'Incident', data: { repair_exit_date } });
      }

      logger.debug('Sending update to database', { component: 'Incident', data: updateData });

      try {
        const { data, error } = await supabase
          .from('NEW_Incidents')
          .update(updateData)
          .eq('id', incidentId)
          .select(`
            *,
            status:NEW_Incident_Status(*)
          `)
          .single();

        if (error) {
          console.error('❌ Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`Database error: ${error.message}`);
        }

        logger.debug('Database update successful', { component: 'Incident', data: { id: data?.id } });
        return data;
      } catch (err: unknown) {
        console.error('❌ Unexpected error during update:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      logger.debug('Mutation successful, invalidating queries', { component: 'Incident' });
      queryClient.invalidateQueries({ queryKey: ['new-incidents'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la incidencia se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Mutation error:', error);

      toast({
        title: "Error al actualizar estado",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};

// Hook for deleting new incidents
export const useDeleteNewIncident = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      logger.debug('Deleting incident', { component: 'Incident', data: { incidentId } });

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
        console.error('❌ Error deleting new incident:', error);
        throw new Error(`Error al eliminar la incidencia: ${error.message}`);
      }

      logger.debug('Incident deleted successfully', { component: 'Incident', data: { incidentId } });
      return incidentId;
    },
    onSuccess: (deletedId) => {
      logger.debug('Incident deletion successful, invalidating queries', { component: 'Incident' });

      // Invalidate all incident queries
      queryClient.invalidateQueries({ queryKey: ['new-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });

      toast({
        title: "✅ Incidencia eliminada",
        description: "La incidencia ha sido eliminada permanentemente de la base de datos.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Error deleting new incident:', error);
      toast({
        title: "❌ Error al eliminar incidencia",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });
};