
import React from 'react';
import { Badge } from '../ui/badge';
import { BudgetPack } from '../../types/budgets';

interface PackItemDetailsProps {
  pack: BudgetPack;
}

const PackItemDetails = ({ pack }: PackItemDetailsProps) => {
  if (!pack.pack_components || pack.pack_components.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
      <p className="text-xs font-medium text-blue-800 mb-2">Incluye:</p>
      <div className="space-y-1">
        {pack.pack_components.map((component) => (
          <div key={component.id} className="flex items-center justify-between text-xs">
            <span className="text-blue-700">{component.name}</span>
            <div className="flex items-center gap-1">
              {component.is_removable && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Removible
                </Badge>
              )}
              {(component.price_reduction || 0) > 0 && (
                <Badge variant="outline" className="text-xs px-1 py-0 text-green-600">
                  -{component.price_reduction?.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackItemDetails;
