
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Trash2 } from 'lucide-react';
import { BudgetItem } from '../../../types/budgets';

interface BudgetItemsListProps {
  items: BudgetItem[];
  onItemRemove: (itemId: string) => void;
  onQuantityUpdate: (itemId: string, quantity: number) => void;
  onDiscountUpdate: (itemId: string, discount: number) => void;
}

const BudgetItemsList = ({
  items,
  onItemRemove,
  onQuantityUpdate,
  onDiscountUpdate
}: BudgetItemsListProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const getCategoryName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'vehiculo': 'Vehículo',
      'modelo': 'Modelo',
      'color_interior': 'Color Interior',
      'pack': 'Pack',
      'sistema_electrico': 'Sistema Eléctrico',
      'extra': 'Extras',
      'personalizado': 'Conceptos Personalizados'
    };
    return categoryNames[category] || category;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conceptos del Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No hay conceptos añadidos al presupuesto
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar items por categoría
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conceptos del Presupuesto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <div key={category} className="border-b pb-4 last:border-b-0">
            <h4 className="font-medium text-gray-700 mb-3">
              {getCategoryName(category)}
            </h4>
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.name}</h5>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        Precio unitario: {formatPrice(item.price)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onItemRemove(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label htmlFor={`quantity-${item.id}`} className="text-sm">
                        Cantidad
                      </Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => onQuantityUpdate(item.id, parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`discount-${item.id}`} className="text-sm">
                        Descuento (%)
                      </Label>
                      <Input
                        id={`discount-${item.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discount_percentage || 0}
                        onChange={(e) => onDiscountUpdate(item.id, parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="text-right">
                      <Label className="text-sm text-gray-600">Total línea</Label>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatPrice(item.line_total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BudgetItemsList;
