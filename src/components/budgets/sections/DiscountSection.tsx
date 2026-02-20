
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { NumericInput } from '../../ui/numeric-input';
import { Minus, Trash2 } from 'lucide-react';
import { BudgetItem } from '../../../types/budgets';

interface DiscountSectionProps {
  onDiscountAdd: (name: string, amount: number) => void;
  items: BudgetItem[];
  onDiscountRemove: (itemId: string) => void;
}

const DiscountSection = ({ onDiscountAdd, items, onDiscountRemove }: DiscountSectionProps) => {
  const [discountName, setDiscountName] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  const handleAddDiscount = () => {
    const amount = parseFloat(discountAmount);
    if (!discountName.trim() || !amount || amount <= 0) {
      return;
    }

    onDiscountAdd(discountName, amount);
    
    // Reset form
    setDiscountName('');
    setDiscountAmount('');
  };

  const formatPrice = (price: number) => {
    return Math.abs(price).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  // Filtrar solo los descuentos de los items
  const discountItems = items.filter(item => item.category === 'descuento');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Descuentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="discount-name">Concepto de descuento</Label>
              <Input
                id="discount-name"
                value={discountName}
                onChange={(e) => setDiscountName(e.target.value)}
                placeholder="Ej: Descuento cliente frecuente"
              />
            </div>
            <div className="w-32">
              <Label htmlFor="discount-amount">Importe (€)</Label>
              <NumericInput
                id="discount-amount"
                value={discountAmount}
                onChange={(displayValue) => setDiscountAmount(displayValue)}
                placeholder="0"
                min={0}
                allowDecimals={true}
              />
            </div>
            <Button
              onClick={handleAddDiscount}
              disabled={!discountName.trim() || !discountAmount || parseFloat(discountAmount) <= 0}
              className="bg-red-600 hover:bg-red-700"
            >
              <Minus className="h-4 w-4 mr-2" />
              Añadir Descuento
            </Button>
          </div>

          {/* Mostrar descuentos añadidos */}
          {discountItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-700 mb-2">Descuentos Añadidos:</h4>
              {discountItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border bg-red-50 border-red-200">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-red-800">{item.name}</p>
                      <p className="text-red-600 text-sm font-medium">
                        -{formatPrice(Math.abs(item.line_total))}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDiscountRemove(item.id)}
                      className="h-6 w-6 p-0 hover:bg-red-200"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscountSection;
