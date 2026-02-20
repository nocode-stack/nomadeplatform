
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { BudgetConcept } from '../../types/budgets';

interface BudgetConceptSelectorProps {
  concepts: BudgetConcept[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConcepts: (concepts: BudgetConcept[]) => void;
}

const BudgetConceptSelector = ({ concepts, open, onOpenChange, onSelectConcepts }: BudgetConceptSelectorProps) => {
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set());

  const handleConceptToggle = (conceptId: string) => {
    const newSelected = new Set(selectedConcepts);
    if (newSelected.has(conceptId)) {
      newSelected.delete(conceptId);
    } else {
      newSelected.add(conceptId);
    }
    setSelectedConcepts(newSelected);
  };

  const handleSelectAll = (category: string) => {
    const categoryConcepts = concepts.filter(c => c.category === category);
    const newSelected = new Set(selectedConcepts);
    
    const allSelected = categoryConcepts.every(c => newSelected.has(c.id));
    
    if (allSelected) {
      categoryConcepts.forEach(c => newSelected.delete(c.id));
    } else {
      categoryConcepts.forEach(c => newSelected.add(c.id));
    }
    
    setSelectedConcepts(newSelected);
  };

  const handleConfirm = () => {
    const selectedConceptsData = concepts.filter(c => selectedConcepts.has(c.id));
    onSelectConcepts(selectedConceptsData);
    setSelectedConcepts(new Set());
    onOpenChange(false);
  };

  const groupedConcepts = concepts.reduce((acc, concept) => {
    if (!acc[concept.category]) {
      acc[concept.category] = [];
    }
    acc[concept.category].push(concept);
    return acc;
  }, {} as Record<string, BudgetConcept[]>);

  const categoryLabels = {
    base: 'Base del Vehículo',
    modelo: 'Modelo',
    color_interior: 'Color Interior',
    opcionales: 'Packs Opcionales',
    sistema_electrico: 'Sistema Eléctrico',
    otros: 'Otros'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar Conceptos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {Object.entries(groupedConcepts).map(([category, categoryConcepts]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(category)}
                  >
                    {categoryConcepts.every(c => selectedConcepts.has(c.id)) 
                      ? 'Deseleccionar todo' 
                      : 'Seleccionar todo'
                    }
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedConcepts.has(concept.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleConceptToggle(concept.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedConcepts.has(concept.id)}
                          onChange={() => handleConceptToggle(concept.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{concept.name}</h4>
                          {concept.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {concept.description}
                            </p>
                          )}
                          {concept.subcategory && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {concept.subcategory}
                            </Badge>
                          )}
                          <div className="mt-2">
                            <span className="font-bold text-green-600">
                              {concept.price > 0
                                ? concept.price.toLocaleString('es-ES', {
                                    style: 'currency',
                                    currency: 'EUR'
                                  })
                                : 'Incluido'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            {selectedConcepts.size} conceptos seleccionados
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedConcepts.size === 0}
            >
              Agregar Conceptos ({selectedConcepts.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetConceptSelector;
