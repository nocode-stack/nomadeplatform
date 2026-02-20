
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  department?: string | null;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('name');

      if (error) {
        logger.error('Error fetching users', { component: 'Users', action: 'fetch', data: error });
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
