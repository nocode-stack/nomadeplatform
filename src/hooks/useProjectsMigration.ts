
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PROJECT_QUERY_KEYS } from './useUnifiedProjects';
import { logger } from '@/utils/logger';

export const useProjectsMigration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const migrateSingleProject = useMutation({
    mutationFn: async (projectId: string) => {
      logger.project.update(projectId, { action: 'migration' });

      // 1. Verificar que el proyecto existe en NEW_Projects
      const { data: newProject, error: newProjectError } = await supabase
        .from('NEW_Projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (newProjectError) throw newProjectError;

      // 2. Verificar si ya tiene fases en el nuevo sistema
      const { data: existingNewPhases } = await supabase
        .from('NEW_Project_Phase_Progress')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      if (!existingNewPhases || existingNewPhases.length === 0) {
        // 3. Inicializar las nuevas fases del proyecto
        const { error: phasesError } = await supabase
          .rpc('initialize_new_project_phases', { project_id_param: projectId });

        if (phasesError) throw phasesError;
        logger.debug('Fases inicializadas', { component: 'Migration', data: { projectId } });
      } else {
        logger.debug('Proyecto ya tiene fases', { component: 'Migration', data: { projectId } });
      }

      return { projectId, success: true };
    },
    onSuccess: (data) => {

      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.all });
    },
    onError: (error, projectId) => {
      logger.error('Error vinculando proyecto', { component: 'Migration', data: { projectId, error } });
      toast({
        title: "Error en vinculación",
        description: `No se pudo vincular el proyecto: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const migrateAllProjects = useMutation({
    mutationFn: async () => {
      logger.info('Vinculación masiva iniciada', { component: 'Migration' });

      // Obtener todos los proyectos de NEW_Projects
      const { data: projects, error } = await supabase
        .from('NEW_Projects')
        .select('id, project_code');

      if (error) throw error;

      const results: Array<{ id: string; success: boolean; error?: unknown }> = [];

      // Vincular uno por uno para evitar problemas de concurrencia
      for (const project of projects || []) {
        try {
          await migrateSingleProject.mutateAsync(project.id);
          results.push({ id: project.id, success: true });
        } catch (err) {
          logger.error(`Error vinculando ${project.project_code}`, { component: 'Migration', data: err });
          results.push({ id: project.id, success: false, error: err });
        }
      }

      return {
        total: projects?.length || 0,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    },
    onSuccess: (results) => {
      toast({
        title: "Vinculación completada",
        description: `${results.successful}/${results.total} proyectos vinculados exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.all });
    },
    onError: (error) => {
      logger.error('Error en vinculación masiva', { component: 'Migration', data: error });
      toast({
        title: "Error en vinculación masiva",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    migrateSingleProject: migrateSingleProject.mutate,
    migrateAllProjects: migrateAllProjects.mutate,
    isMigrating: migrateSingleProject.isPending || migrateAllProjects.isPending,
  };
};
