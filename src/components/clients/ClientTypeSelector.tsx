import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { User, Search, Building } from 'lucide-react';

interface ClientTypeSelectorProps {
  onSelect: (type: 'prospect' | 'client') => void;
  onCancel: () => void;
}

const ClientTypeSelector = ({ onSelect, onCancel }: ClientTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">¿Qué tipo de cliente es?</h2>
        <p className="text-gray-600 mt-2">
          Selecciona el tipo de cliente para configurar las opciones apropiadas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prospect */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
          onClick={() => onSelect('prospect')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Prospect</CardTitle>
            <CardDescription>
              Cliente potencial en proceso comercial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Código: PC_25_XXX
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Sin asignación de vehículos
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Sin slots de producción
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Sin generación de incidencias
              </li>
            </ul>
            <Button className="w-full mt-4" onClick={() => onSelect('prospect')}>
              Crear como Prospect
            </Button>
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
          onClick={() => onSelect('client')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Cliente</CardTitle>
            <CardDescription>
              Cliente confirmado con proyecto activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Código: CL_25_XXX
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Asignación de vehículos
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Slots de producción
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Gestión completa de incidencias
              </li>
            </ul>
            <Button className="w-full mt-4" onClick={() => onSelect('client')}>
              Crear como Cliente
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default ClientTypeSelector;