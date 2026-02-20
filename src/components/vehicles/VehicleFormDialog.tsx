
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import VehicleForm from './VehicleForm';
import { VehicleFormData, Vehicle } from '../../types/vehicles';

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VehicleFormData) => void;
  vehicle?: Vehicle;
  isLoading?: boolean;
}

const VehicleFormDialog = ({ open, onOpenChange, onSubmit, vehicle, isLoading }: VehicleFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </DialogTitle>
        </DialogHeader>
        <VehicleForm
          onSubmit={onSubmit}
          vehicle={vehicle}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VehicleFormDialog;
