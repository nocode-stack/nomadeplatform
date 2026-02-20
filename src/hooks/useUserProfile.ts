
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  department?: string | null;
  role?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = (userId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      logger.debug('Buscando perfil', { component: 'UserProfile', action: 'fetch', data: { userId } });

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching user profile', { component: 'UserProfile', action: 'fetch', data: error });
          return null;
        }

        if (data) {
          return data;
        }

        // Si no existe el perfil, crearlo automáticamente
        if (user && user.id === userId) {
          logger.info('Creando perfil automáticamente', { component: 'UserProfile', action: 'create', data: { userId } });

          const newProfile = {
            user_id: userId,
            name: user.name,
            email: user.email,
            department: user.department,
            avatar_url: user.avatar
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            logger.error('Error creando perfil', { component: 'UserProfile', action: 'create', data: createError });
            return null;
          }

          return createdProfile;
        }

        return null;
      } catch (error) {
        logger.error('Error conectando con Supabase', { component: 'UserProfile', action: 'fetch', data: error });
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<UserProfile> & { user_id: string }) => {
      logger.debug('Actualizando perfil', { component: 'UserProfile', action: 'update', data });

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url,
          department: data.department,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error updating profile', { component: 'UserProfile', action: 'update', data: error });
        throw error;
      }

      return profile;
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.setQueryData(['user-profile', profile.user_id], profile);

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      logger.error('Error updating profile', { component: 'UserProfile', action: 'update', data: error });
      toast({
        title: "Error al actualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
