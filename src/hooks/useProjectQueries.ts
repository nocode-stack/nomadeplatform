import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Hook for fetching the projects list with client data */
export const useProjectsList = () => {
    return useQuery({
        queryKey: ['new-projects-list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('NEW_Projects')
                .select(`
          *,
          NEW_Clients(*)
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching NEW_Projects:', error);
                throw error;
            }

            return data?.map(project => ({
                id: project.id,
                code: project.project_code,
                name: project.project_code || 'Código pendiente',
                client_name: project.NEW_Clients?.name || 'Sin cliente',
                new_clients: project.NEW_Clients,
                status: project.status || 'prospect',
                created_at: project.created_at,
                updated_at: project.updated_at
            })) || [];
        },
        staleTime: 30000,
    });
};

/** Hook for fetching a single project with phases and client data */
export const useProject = (projectId: string) => {
    return useQuery({
        queryKey: ['new-project', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('NEW_Projects')
                .select(`
          *,
          NEW_Clients(*),
          NEW_Project_Phase_Progress(
            *,
            NEW_Project_Phase_Template(*)
          )
        `)
                .eq('id', projectId)
                .single();

            if (error) {
                console.error('❌ Error fetching NEW_Project:', error);
                throw error;
            }

            return {
                ...data,
                code: data.project_code,
                name: data.project_code || 'Código pendiente',
                model: 'Por definir',
                power: 'Por definir',
                client_name: data.NEW_Clients?.name || 'Sin cliente',
                new_clients: data.NEW_Clients,
                NEW_Clients: data.NEW_Clients,
                project_phase_progress: data.NEW_Project_Phase_Progress || []
            };
        },
        enabled: !!projectId,
    });
};
