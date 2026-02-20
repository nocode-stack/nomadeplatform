import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ElectricSystemPricing {
  finalPrice: number;
  originalPrice: number;
  discountAmount: number;
  isFree: boolean;
  discountReason: string | null;
}

export const useElectricSystemPricing = (
  systemId: string | null,
  packId?: string | null,
  packName?: string | null
) => {
  return useQuery({
    queryKey: ['electric-system-pricing', systemId, packId, packName],
    queryFn: async (): Promise<ElectricSystemPricing> => {
      if (!systemId) {
        return {
          finalPrice: 0,
          originalPrice: 0,
          discountAmount: 0,
          isFree: false,
          discountReason: null,
        };
      }

      const { data, error } = await supabase.rpc(
        'calculate_electric_system_price_for_pack',
        {
          system_id: systemId,
          pack_id: packId || null,
          pack_name: packName || null,
        }
      );

      if (error) {
        console.error('Error calculating electric system pricing:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No pricing data returned');
      }

      const pricing = data[0];
      return {
        finalPrice: Number(pricing.final_price) || 0,
        originalPrice: Number(pricing.original_price) || 0,
        discountAmount: Number(pricing.discount_amount) || 0,
        isFree: Boolean(pricing.is_free),
        discountReason: pricing.discount_reason,
      };
    },
    enabled: !!systemId,
  });
};

// Helper function para calcular precios de forma síncrona cuando ya tienes los datos
export const calculateElectricSystemPrice = (
  systemPrice: number,
  packPricingRules: any,
  packId?: string,
  packName?: string
): ElectricSystemPricing => {
  let finalPrice = systemPrice;
  const originalPrice = systemPrice;
  let discountAmount = 0;
  let isFree = false;
  let discountReason: string | null = null;

  if (packPricingRules) {
    // Buscar regla por pack_id primero, luego por pack_name
    let packRule = null;
    
    if (packId && packPricingRules[packId]) {
      packRule = packPricingRules[packId];
    } else if (packName && packPricingRules[packName]) {
      packRule = packPricingRules[packName];
    }

    if (packRule) {
      const ruleType = packRule.type;
      const ruleAmount = Number(packRule.amount) || 0;
      const ruleReason = packRule.reason || null;

      switch (ruleType) {
        case 'free':
          finalPrice = 0;
          discountAmount = originalPrice;
          isFree = true;
          discountReason = ruleReason || 'Incluido en pack';
          break;
        case 'discount':
          discountAmount = ruleAmount;
          finalPrice = Math.max(0, originalPrice - discountAmount);
          discountReason = ruleReason || 'Descuento por pack';
          break;
        case 'fixed_price':
          finalPrice = ruleAmount;
          discountAmount = Math.max(0, originalPrice - finalPrice);
          discountReason = ruleReason || 'Precio especial por pack';
          break;
      }
    }
  }

  return {
    finalPrice,
    originalPrice,
    discountAmount,
    isFree,
    discountReason,
  };
};