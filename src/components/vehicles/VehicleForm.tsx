
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { VehicleFormData, Vehicle } from '../../types/vehicles';

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => void;
  vehicle?: Vehicle;
  isLoading?: boolean;
}

const VehicleForm = ({ onSubmit, vehicle, isLoading }: VehicleFormProps) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<VehicleFormData>({
    defaultValues: vehicle ? {
      numero_bastidor: vehicle.numero_bastidor,
      matricula: vehicle.matricula || '',
      color_exterior: vehicle.color_exterior,
      motorizacion: vehicle.motorizacion,
      plazas: vehicle.plazas,
      proveedor: vehicle.proveedor,
      ubicacion: vehicle.ubicacion,
      estado_pago: vehicle.estado_pago,
      fecha_pago: vehicle.fecha_pago || ''
    } : {
      numero_bastidor: '',
      matricula: '',
      color_exterior: '',
      motorizacion: '140cv manual',
      plazas: 2,
      proveedor: '',
      ubicacion: 'nomade',
      estado_pago: 'pendiente',
      fecha_pago: ''
    }
  });

  const watchEstadoPago = watch('estado_pago');

  const handleFormSubmit = (data: VehicleFormData) => {
    // Si el estado no es "pagada", limpiar la fecha de pago
    if (data.estado_pago !== 'pagada') {
      data.fecha_pago = undefined;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numero_bastidor">Número de Bastidor *</Label>
          <Input
            id="numero_bastidor"
            {...register('numero_bastidor', { required: 'El número de bastidor es requerido' })}
            placeholder="Número de bastidor"
          />
          {errors.numero_bastidor && (
            <p className="text-sm text-red-600">{errors.numero_bastidor.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            id="matricula"
            {...register('matricula')}
            placeholder="Matrícula (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color_exterior">Color Exterior *</Label>
          <Input
            id="color_exterior"
            {...register('color_exterior', { required: 'El color exterior es requerido' })}
            placeholder="Color exterior"
          />
          {errors.color_exterior && (
            <p className="text-sm text-red-600">{errors.color_exterior.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proveedor">Proveedor *</Label>
          <Input
            id="proveedor"
            {...register('proveedor', { required: 'El proveedor es requerido' })}
            placeholder="Proveedor"
          />
          {errors.proveedor && (
            <p className="text-sm text-red-600">{errors.proveedor.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="motorizacion">Motorización *</Label>
          <Select
            value={watch('motorizacion')}
            onValueChange={(value) => setValue('motorizacion', value as '140cv manual' | '180cv automatica')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar motorización" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="140cv manual">140cv Manual</SelectItem>
              <SelectItem value="180cv automatica">180cv Automática</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plazas">Plazas *</Label>
          <Select
            value={watch('plazas')?.toString()}
            onValueChange={(value) => setValue('plazas', parseInt(value) as 2 | 3)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plazas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Plazas</SelectItem>
              <SelectItem value="3">3 Plazas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ubicacion">Ubicación *</Label>
          <Select
            value={watch('ubicacion')}
            onValueChange={(value) => setValue('ubicacion', value as 'nomade' | 'concesionario' | 'taller' | 'cliente')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nomade">Nómade</SelectItem>
              <SelectItem value="concesionario">Concesionario</SelectItem>
              <SelectItem value="taller">Taller</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado_pago">Estado de Pago *</Label>
          <Select
            value={watch('estado_pago')}
            onValueChange={(value) => setValue('estado_pago', value as 'pagada' | 'no_pagada' | 'pendiente')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="pagada">Pagado</SelectItem>
              <SelectItem value="no_pagada">No Pagado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {watchEstadoPago === 'pagada' && (
          <div className="space-y-2">
            <Label htmlFor="fecha_pago">Fecha de Pago</Label>
            <Input
              id="fecha_pago"
              type="date"
              {...register('fecha_pago')}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : vehicle ? 'Actualizar Vehículo' : 'Crear Vehículo'}
        </Button>
      </div>
    </form>
  );
};

export default VehicleForm;
