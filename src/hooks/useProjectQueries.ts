import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Hook for fetching the projects list with client data */
export const useProjectsList = () => {
    return useQuery({
        queryKey: ['new-projects-list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select(`
          *,
          clients(*)
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching projects:', error);
                throw error;
            }

            return data?.map(project => ({
                id: project.id,
                code: project.project_code,
                name: project.project_code || 'Código pendiente',
                client_name: project.clients?.name || 'Sin cliente',
                clients: project.clients,
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
                .from('projects')
                .select(`
          *,
          clients(*),
          project_phase_progress(
            *,
            project_phase_template(*)
          )
        `)
                .eq('id', projectId)
                .single();

            if (error) {
                console.error('❌ Error fetching project:', error);
                throw error;
            }

            return {
                ...data,
                code: data.project_code,
                name: data.project_code || 'Código pendiente',
                model: 'Por definir',
                power: 'Por definir',
                client_name: data.clients?.name || 'Sin cliente',
                clients: data.clients,
                clients: data.clients,
                project_phase_progress: data.project_phase_progress || []
            };
        },
        enabled: !!projectId,
    });
};
