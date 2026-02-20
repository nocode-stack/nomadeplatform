
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ModelOption } from '../../../types/budgets';

interface ModelSelectionProps {
  modelOptions: ModelOption[];
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  isLoading: boolean;
}

const ModelSelection = ({
  modelOptions,
  selectedModel,
  onModelSelect,
  isLoading
}: ModelSelectionProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modelo</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Modelo</CardTitle>
      </CardHeader>
      <CardContent>
        {modelOptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelOptions.map((model) => (
              <div
                key={model.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onModelSelect(model.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{model.name}</h3>
                  {selectedModel === model.id && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    {model.price_modifier.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay modelos disponibles</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelSelection;
