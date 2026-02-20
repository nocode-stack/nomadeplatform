
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import PackSelection from './sections/PackSelection';
import ElectricSystemSelection from './sections/ElectricSystemSelection';
import { useBudgetConfigurator, BudgetConfiguration } from '../../hooks/useBudgetConfigurator';

interface BudgetConfiguratorProps {
  budgetId?: string;
  initialPack?: string;
  initialElectricSystem?: string;
  onConfigurationChange?: (configuration: BudgetConfiguration | null) => void;
}

const BudgetConfigurator = ({
  budgetId: _budgetId,
  initialPack,
  initialElectricSystem,
  onConfigurationChange
}: BudgetConfiguratorProps) => {
  const {
    selectedPack,
    selectedElectricSystem,
    autoSelected,
    packs,
    electricSystems,
    electricSystemPricing: _electricSystemPricing,
    isLoading,
    handlePackSelect,
    handleElectricSystemSelect,
    handleElectricSystemDeselect,
    configuration
  } = useBudgetConfigurator(initialPack, initialElectricSystem);

  // Notificar cambios de configuración
  useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange(configuration);
    }
  }, [configuration, onConfigurationChange]);

  return (
    <div className="space-y-6">
      {/* Selección de Pack */}
      <PackSelection
        packs={packs}
        selectedPack={selectedPack}
        onPackSelect={handlePackSelect}
        isLoading={isLoading}
      />

      {/* Selección de Sistema Eléctrico */}
      <ElectricSystemSelection
        electricSystems={electricSystems}
        selectedElectricSystem={selectedElectricSystem}
        onElectricSystemSelect={handleElectricSystemSelect}
        onElectricSystemDeselect={handleElectricSystemDeselect}
        isLoading={isLoading}
        show={!!selectedPack} // Solo mostrar cuando haya pack seleccionado
        selectedPack={selectedPack}
        packs={packs}
        autoSelected={autoSelected}
      />

      {/* Resumen de configuración */}
      {configuration && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configuration.pack.id && (
                <div className="flex justify-between">
                  <span>Pack seleccionado:</span>
                  <span className="font-medium">
                    {configuration.pack.name}
                  </span>
                </div>
              )}
              {configuration.electricSystem.id && (
                <div className="flex justify-between">
                  <span>Sistema eléctrico:</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {configuration.electricSystem.name}
                    </div>
                    {autoSelected && (
                      <div className="text-xs text-blue-600">
                        Seleccionado automáticamente
                      </div>
                    )}
                    <div className="text-sm">
                      {configuration.electricSystem.isFree ? (
                        <span className="text-green-600 font-medium">Incluido (0€)</span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          {configuration.electricSystem.finalPrice.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </span>
                      )}
                      {configuration.electricSystem.discount > 0 && !configuration.electricSystem.isFree && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Antes: {configuration.electricSystem.originalPrice.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR'
                          })})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetConfigurator;
