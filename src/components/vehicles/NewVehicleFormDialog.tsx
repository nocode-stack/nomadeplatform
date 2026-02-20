import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import NewVehicleForm from './NewVehicleForm';
import { NewVehicleFormData, NewVehicle } from '../../types/vehicles';

interface NewVehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewVehicleFormData) => void;
  vehicle?: NewVehicle;
  isLoading?: boolean;
}

const NewVehicleFormDialog = ({ open, onOpenChange, onSubmit, vehicle, isLoading }: NewVehicleFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? 'Editar Vehículo (NUEVO)' : 'Nuevo Vehículo (NUEVO)'}
          </DialogTitle>
        </DialogHeader>
        <NewVehicleForm
          onSubmit={onSubmit}
          vehicle={vehicle}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewVehicleFormDialog;