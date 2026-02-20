import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBillingData = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ['billing-data', clientId],
    queryFn: async () => {
      if (!clientId) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('NEW_Billing')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};