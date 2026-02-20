import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';

export type ModelOption = Database['public']['Tables']['model_options']['Row'];

export const useModelOptions = () => {
    return useQuery({
        queryKey: ['model-options'],
        queryFn: async (): Promise<ModelOption[]> => {
            const { data, error } = await supabase
                .from('model_options')
                .select('*')
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (error) {
                console.error('Error fetching model options:', error);
                throw error;
            }

            return data || [];
        },
    });
};
