
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Info } from 'lucide-react';
import { VehicleOption } from '../../../types/budgets';

interface VehicleSelectionProps {
  vehicleOptions: VehicleOption[];
  selectedVehicleOption: string;
  onVehicleSelect: (vehicleId: string) => void;
  isLoading: boolean;
}

const VehicleSelection = ({
  vehicleOptions,
  selectedVehicleOption,
  onVehicleSelect,
  isLoading
}: VehicleSelectionProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vehículo Base</CardTitle>
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
        <CardTitle className="text-lg">Vehículo Base</CardTitle>
      </CardHeader>
      <CardContent>
        {vehicleOptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleOptions.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedVehicleOption === vehicle.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onVehicleSelect(vehicle.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{vehicle.name}</h3>
                  <div className="flex items-center text-blue-600">
                    <Info className="h-4 w-4" />
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{vehicle.power} - {vehicle.transmission}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    {vehicle.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                  {selectedVehicleOption === vehicle.id && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay vehículos disponibles</p>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleSelection;
