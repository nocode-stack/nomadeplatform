
import { useMemo } from 'react';
import { useElectricSystemPricing } from './useElectricSystemPricing';
import { useNewBudgetPacks } from './useNewBudgets';

export const useNewBudgetElectricPricing = (
  selectedPackId: string | null,
  selectedElectricSystemId: string | null
) => {
  const { data: packs = [] } = useNewBudgetPacks();
  
  const selectedPack = useMemo(() => 
    packs.find(p => p.id === selectedPackId), 
    [packs, selectedPackId]
  );

  const { data: electricPricing, isLoading } = useElectricSystemPricing(
    selectedElectricSystemId,
    selectedPackId,
    selectedPack?.name || null
  );

  return {
    electricPricing,
    isLoading,
    selectedPack
  };
};
