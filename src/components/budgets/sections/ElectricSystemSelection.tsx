
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { X, Zap } from 'lucide-react';
import { ElectricSystem, BudgetPack } from '../../../types/budgets';
import { calculateElectricSystemPrice } from '../../../hooks/useElectricSystemPricing';

interface ElectricSystemSelectionProps {
  electricSystems: ElectricSystem[];
  selectedElectricSystem: string;
  onElectricSystemSelect: (systemId: string) => void;
  onElectricSystemDeselect: () => void;
  isLoading: boolean;
  show: boolean;
  selectedPack?: string;
  packs?: BudgetPack[];
  autoSelected?: boolean;
}

const ElectricSystemSelection = ({
  electricSystems,
  selectedElectricSystem,
  onElectricSystemSelect,
  onElectricSystemDeselect,
  isLoading,
  show,
  selectedPack,
  packs = [],
  autoSelected = false
}: ElectricSystemSelectionProps) => {
  if (!show) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sistema Eléctrico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get selected pack data
  const selectedPackData = selectedPack ? packs.find(p => p.id === selectedPack) : null;
  const selectedSystem = electricSystems.find(s => s.id === selectedElectricSystem);

  // Helper function to get pricing for a system with current pack
  const getSystemPricing = (system: ElectricSystem) => {
    if (!selectedPackData || !system.pack_pricing_rules) {
      return {
        finalPrice: system.discount_price || system.price,
        originalPrice: system.price,
        discountAmount: system.discount_price ? system.price - system.discount_price : 0,
        isFree: false,
        discountReason: system.discount_price ? 'Precio con descuento' : null
      };
    }

    return calculateElectricSystemPrice(
      system.price,
      system.pack_pricing_rules,
      selectedPackData.id,
      selectedPackData.name
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            Sistema Eléctrico
            {selectedPackData && (selectedPackData.name === 'Adventure' || selectedPackData.name === 'Ultimate') && (
              <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                <Zap className="h-3 w-3" />
                Auto-selección activa
              </div>
            )}
          </div>
          {selectedElectricSystem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onElectricSystemDeselect}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Quitar selección
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedSystem && (
          <div className={`mb-4 p-3 rounded-lg border ${
            autoSelected ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-medium ${
                  autoSelected ? 'text-blue-800' : 'text-green-800'
                }`}>
                  {autoSelected ? 'Sistema Auto-seleccionado:' : 'Sistema Seleccionado:'}
                </h4>
                <p className={`text-sm ${
                  autoSelected ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {selectedSystem.name}
                </p>
              </div>
              {autoSelected && (
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Incluido en {selectedPackData?.name}
                </div>
              )}
            </div>
          </div>
        )}
        
        {electricSystems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {electricSystems.map((system) => {
              const isSelected = selectedElectricSystem === system.id;
              const pricing = getSystemPricing(system);
              
              const showOriginalPrice = pricing.discountAmount > 0 || pricing.isFree;
              const priceLabel = pricing.isFree ? 'Incluido' : '';
              
              return (
                <div
                  key={system.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? autoSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => onElectricSystemSelect(system.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{system.name}</h4>
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        autoSelected ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {system.description && (
                    <p className="text-gray-600 text-sm mb-3">{system.description}</p>
                  )}
                  
                   <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                       {showOriginalPrice && (
                         <span className="text-sm text-gray-500 line-through">
                           {pricing.originalPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                         </span>
                       )}
                       <div className="flex items-center gap-2">
                         <span className="text-xl font-bold text-green-600">
                           {pricing.finalPrice === 0 ? '0€' : pricing.finalPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                         </span>
                         {priceLabel && (
                           <span className="text-sm text-green-600 font-medium">
                             ({priceLabel})
                           </span>
                         )}
                         {pricing.discountReason && !pricing.isFree && (
                           <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                             {pricing.discountReason}
                           </span>
                         )}
                       </div>
                       {pricing.discountAmount > 0 && !pricing.isFree && (
                         <span className="text-xs text-green-600">
                           Ahorras {pricing.discountAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                         </span>
                       )}
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay sistemas eléctricos disponibles</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ElectricSystemSelection;
