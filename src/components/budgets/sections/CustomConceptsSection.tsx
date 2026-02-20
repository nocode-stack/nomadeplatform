
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { NumericInput } from '../../ui/numeric-input';
import { Plus, Trash2 } from 'lucide-react';
import { BudgetItem } from '../../../types/budgets';

interface CustomConceptsSectionProps {
  onConceptAdd: (name: string, price: number) => void;
  items: BudgetItem[];
  onConceptRemove: (itemId: string) => void;
}

const CustomConceptsSection = ({ onConceptAdd, items, onConceptRemove }: CustomConceptsSectionProps) => {
  const [conceptName, setConceptName] = useState('');
  const [conceptPrice, setConceptPrice] = useState('');

  const handleAddConcept = () => {
    const price = parseFloat(conceptPrice);
    if (!conceptName.trim() || !conceptPrice || price <= 0) {
      return;
    }

    onConceptAdd(conceptName, price);
    
    // Reset form
    setConceptName('');
    setConceptPrice('');
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  // Get custom concepts from items
  const customConcepts = items.filter(item => item.category === 'personalizado');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conceptos Personalizados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="concept-name">Nombre del concepto</Label>
            <Input
              id="concept-name"
              value={conceptName}
              onChange={(e) => setConceptName(e.target.value)}
              placeholder="Ej: Instalación especial"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="concept-price">Precio (€)</Label>
            <NumericInput
              id="concept-price"
              value={conceptPrice}
              onChange={(displayValue) => setConceptPrice(displayValue)}
              placeholder="0"
              min={0}
              allowDecimals={true}
            />
          </div>
          <Button
            onClick={handleAddConcept}
            disabled={!conceptName.trim() || !conceptPrice || parseFloat(conceptPrice) <= 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir
          </Button>
        </div>

        {/* Added Custom Concepts Section */}
        {customConcepts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-700 mb-3">Conceptos Añadidos:</h4>
            <div className="space-y-2">
              {customConcepts.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm font-medium text-blue-700">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConceptRemove(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomConceptsSection;
