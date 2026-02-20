
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { BudgetPack } from '../../../types/budgets';

interface PackDetailsDialogProps {
  pack: BudgetPack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PackDetailsDialog = ({ pack, open, onOpenChange }: PackDetailsDialogProps) => {
  if (!pack) return null;

  const formatPrice = (price: number) => {
    return price.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-xl">{pack.name}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {pack.description && (
              <div>
                <h4 className="font-medium mb-2">Descripción</h4>
                <p className="text-gray-600">{pack.description}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Precio del Pack:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(pack.price)}
              </span>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Al seleccionar este pack, se añadirá automáticamente 
                a tu presupuesto y se aplicarán las configuraciones correspondientes.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PackDetailsDialog;
