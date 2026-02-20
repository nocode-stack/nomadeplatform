
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Info } from 'lucide-react';
import { BudgetPack } from '../../../types/budgets';
import PackDetailsDialog from './PackDetailsDialog';
import { logger } from '../../../utils/logger';

interface PackSelectionProps {
  packs: BudgetPack[];
  selectedPack: string;
  onPackSelect: (packId: string) => void;
  isLoading: boolean;
}

const PackSelection = ({
  packs,
  selectedPack,
  onPackSelect,
  isLoading
}: PackSelectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackForDialog, setSelectedPackForDialog] = useState<BudgetPack | null>(null);

  const handleInfoClick = (pack: BudgetPack, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('Opening pack details', { component: 'PackSelection', data: { packName: pack.name } });
    setSelectedPackForDialog(pack);
    setDialogOpen(true);
  };

  const handlePackSelect = (packId: string) => {
    logger.debug('Selecting pack', { component: 'PackSelection', data: { packId } });
    onPackSelect(packId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selección de Pack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selección de Pack</CardTitle>
        </CardHeader>
        <CardContent>
          {packs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedPack === pack.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handlePackSelect(pack.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">{pack.name}</h3>
                    <button
                      type="button"
                      onClick={(e) => handleInfoClick(pack, e)}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors z-10"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {pack.description && (
                    <p className="text-gray-600 text-sm mb-3">{pack.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      {pack.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                    {selectedPack === pack.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay packs disponibles</p>
          )}
        </CardContent>
      </Card>

      <PackDetailsDialog
        pack={selectedPackForDialog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default PackSelection;
