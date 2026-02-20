
import { useState, useEffect } from 'react';
import { useNewBudgetPacks, useElectricSystems } from './useNewBudgets';
import { useElectricSystemPricing } from './useElectricSystemPricing';
import { BudgetPack, ElectricSystem } from '../types/budgets';

export interface BudgetConfiguration {
  pack: {
    id: string;
    name: string;
    price: number;
  };
  electricSystem: {
    id: string;
    name: string;
    originalPrice: number;
    finalPrice: number;
    discount: number;
    isFree: boolean;
    discountReason: string | null;
  };
  autoSelected: boolean;
}

export const useBudgetConfigurator = (initialPack?: string, initialElectricSystem?: string) => {
  const [selectedPack, setSelectedPack] = useState<string>(initialPack || '');
  const [selectedElectricSystem, setSelectedElectricSystem] = useState<string>(initialElectricSystem || '');
  const [autoSelected, setAutoSelected] = useState<boolean>(false);

  // Hooks para datos
  const { data: packs = [], isLoading: packsLoading } = useNewBudgetPacks();
  const { data: electricSystems = [], isLoading: electricSystemsLoading } = useElectricSystems();

  // Hook para pricing del sistema eléctrico seleccionado
  const selectedPackData = packs.find(p => p.id === selectedPack);
  const { data: electricSystemPricing } = useElectricSystemPricing(
    selectedElectricSystem || null,
    selectedPack || null,
    selectedPackData?.name || null
  );

  // Lógica automática de selección del sistema eléctrico
  useEffect(() => {
    if (import.meta.env.DEV) console.log('🔍 useEffect triggered:', { 
      selectedPack, 
      electricSystemsLength: electricSystems.length, 
      packsLength: packs.length,
      currentSelectedElectricSystem: selectedElectricSystem 
    });

    if (selectedPack && electricSystems.length > 0 && packs.length > 0) {
      const packData = packs.find(p => p.id === selectedPack);
      if (import.meta.env.DEV) console.log('📦 Pack data found:', packData);
      
      if (packData && (packData.name === 'Adventure' || packData.name === 'Ultimate')) {
        if (import.meta.env.DEV) console.log('🎯 Pack is Adventure or Ultimate, looking for Litio system...');
        
        // Buscar el sistema Litio básico (sin + o Plus o Pro)
        const litioBasico = electricSystems.find(system => {
          const isLitio = system.name.toLowerCase().includes('litio');
          const hasPlus = system.name.toLowerCase().includes('+');
          const hasPlus2 = system.name.toLowerCase().includes('plus');
          const hasPro = system.name.toLowerCase().includes('pro');
          const isActive = system.is_active;
          
          if (import.meta.env.DEV) console.log('🔋 Checking system:', {
            name: system.name,
            isLitio,
            hasPlus,
            hasPlus2,
            hasPro,
            isActive,
            qualifies: isLitio && !hasPlus && !hasPlus2 && !hasPro && isActive
          });
          
          return isLitio && !hasPlus && !hasPlus2 && !hasPro && isActive;
        });
        
        if (litioBasico) {
          if (import.meta.env.DEV) console.log('✅ Litio básico encontrado:', litioBasico.name, 'ID:', litioBasico.id);
          if (selectedElectricSystem !== litioBasico.id) {
            if (import.meta.env.DEV) console.log('🔄 Auto-seleccionando sistema Litio para pack:', packData.name);
            setSelectedElectricSystem(litioBasico.id);
            setAutoSelected(true);
          }
        } else {
          if (import.meta.env.DEV) console.log('❌ No se encontró sistema Litio básico');
          if (import.meta.env.DEV) console.log('Sistemas disponibles:', electricSystems.map(s => ({ name: s.name, active: s.is_active })));
        }
      } else if (packData?.name === 'Essentials') {
        if (import.meta.env.DEV) console.log('📝 Pack Essentials seleccionado, limpiando auto-selección');
        if (autoSelected) {
          setAutoSelected(false);
        }
      } else {
        if (import.meta.env.DEV) console.log('📋 Pack no reconocido o no requiere auto-selección:', packData?.name);
      }
    }
  }, [selectedPack, electricSystems, packs]); // Removed selectedElectricSystem and autoSelected to prevent infinite loops

  // Handlers
  const handlePackSelect = (packId: string) => {
    if (import.meta.env.DEV) console.log('📦 Seleccionando pack:', packId);
    setSelectedPack(packId);
  };

  const handleElectricSystemSelect = (systemId: string) => {
    if (import.meta.env.DEV) console.log('🔋 Seleccionando sistema eléctrico:', systemId);
    setSelectedElectricSystem(systemId);
    setAutoSelected(false); // User made manual selection
  };

  const handleElectricSystemDeselect = () => {
    if (import.meta.env.DEV) console.log('🔋 Deseleccionando sistema eléctrico');
    setSelectedElectricSystem('');
    setAutoSelected(false);
  };

  // Calcular configuración actual
  const getConfiguration = (): BudgetConfiguration | null => {
    if (!selectedPack && !selectedElectricSystem) return null;

    const selectedPackData = packs.find(p => p.id === selectedPack);
    const selectedSystemData = electricSystems.find(s => s.id === selectedElectricSystem);
    
    return {
      pack: {
        id: selectedPack,
        name: selectedPackData?.name || '',
        price: selectedPackData?.price || 0
      },
      electricSystem: {
        id: selectedElectricSystem,
        name: selectedSystemData?.name || '',
        originalPrice: selectedSystemData?.price || 0,
        finalPrice: electricSystemPricing?.finalPrice || selectedSystemData?.price || 0,
        discount: electricSystemPricing?.discountAmount || 0,
        isFree: electricSystemPricing?.isFree || false,
        discountReason: electricSystemPricing?.discountReason || null
      },
      autoSelected
    };
  };

  return {
    // Estado
    selectedPack,
    selectedElectricSystem,
    autoSelected,
    
    // Datos
    packs,
    electricSystems,
    electricSystemPricing,
    
    // Loading states
    isLoading: packsLoading || electricSystemsLoading,
    
    // Handlers
    handlePackSelect,
    handleElectricSystemSelect,
    handleElectricSystemDeselect,
    
    // Configuración
    configuration: getConfiguration(),
  };
};
