import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { NewVehicleFormData, NewVehicle } from '../../types/vehicles';

interface NewVehicleFormProps {
  onSubmit: (data: NewVehicleFormData) => void;
  vehicle?: NewVehicle;
  isLoading?: boolean;
}

const NewVehicleForm = ({ onSubmit, vehicle, isLoading }: NewVehicleFormProps) => {
  const form = useForm<NewVehicleFormData>({
    defaultValues: {
      numero_bastidor: vehicle?.numero_bastidor || '',
      matricula: vehicle?.matricula || '',
      engine: vehicle?.engine || '',
      transmission_type: vehicle?.transmission_type || '',
      exterior_color: vehicle?.exterior_color || '',
      plazas: vehicle?.plazas || '',
      dimensions: vehicle?.dimensions || '',
      proveedor: vehicle?.proveedor || '',
      estado_pago: vehicle?.estado_pago || 'pendiente',
      fecha_pago: vehicle?.fecha_pago || '',
      location: vehicle?.location || '',
    }
  });

  const watchEstadoPago = form.watch('estado_pago');

  const handleFormSubmit = (data: NewVehicleFormData) => {
    // Si el estado no es "pagada", limpiar la fecha de pago
    if (data.estado_pago !== 'pagada') {
      data.fecha_pago = undefined;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="numero_bastidor"
            rules={{ required: 'El número de bastidor es requerido' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Bastidor *</FormLabel>
                <FormControl>
                  <Input placeholder="Número de bastidor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="matricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matrícula</FormLabel>
                <FormControl>
                  <Input placeholder="Matrícula (opcional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="engine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motor</FormLabel>
                <FormControl>
                  <Input placeholder="ej. 2.0 TDI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transmission_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmisión</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona transmisión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatica">Automática</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exterior_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color Exterior</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Blanco" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plazas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plazas</FormLabel>
                <FormControl>
                  <Input placeholder="ej. 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimensiones</FormLabel>
                <FormControl>
                  <Input placeholder="ej. L:5m W:2m H:2.5m" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="proveedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <FormControl>
                  <Input placeholder="Proveedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estado_pago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de Pago</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagada">Pagado</SelectItem>
                      <SelectItem value="no_pagada">No Pagado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchEstadoPago === 'pagada' && (
            <FormField
              control={form.control}
              name="fecha_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Pago</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : vehicle ? 'Actualizar Vehículo' : 'Crear Vehículo'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewVehicleForm;