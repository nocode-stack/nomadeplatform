import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { NewVehicle, NewVehicleFormData } from '../types/vehicles';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

export const useNewVehicles = () => {
  return useQuery({
    queryKey: ['new-vehicles'],
    queryFn: async (): Promise<NewVehicle[]> => {
      const { data, error } = await supabase
        .from('NEW_Vehicles')
        .select(`
          *,
          NEW_Projects!NEW_Vehicles_project_id_fkey (
            id,
            project_code,
            NEW_Clients!NEW_Projects_client_id_fkey (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching new vehicles:', error);
        throw error;
      }

      logger.debug('NEW_Vehicles raw data fetched', { component: 'Vehicle', data: { count: data?.length } });

      // Transform the data to match our interface
      return (data || []).map(vehicle => ({
        ...vehicle,
        estado_pago: vehicle.estado_pago as 'pagada' | 'no_pagada' | 'pendiente',
        projects: vehicle.NEW_Projects ? {
          id: vehicle.NEW_Projects.id,
          name: vehicle.NEW_Projects.project_code || '',
          code: vehicle.NEW_Projects.project_code || '',
          clients: vehicle.NEW_Projects.NEW_Clients ? {
            name: vehicle.NEW_Projects.NEW_Clients.name || ''
          } : null
        } : null
      }));
    },
  });
};

export const useCreateNewVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicleData: NewVehicleFormData): Promise<NewVehicle> => {
      // Añadir un vehicle_code temporal que será reemplazado por el trigger
      const insertData = {
        ...vehicleData,
        vehicle_code: 'TEMP_CODE' // El trigger lo reemplazará automáticamente
      };

      const { data, error } = await supabase
        .from('NEW_Vehicles')
        .insert(insertData)
        .select(`
          *,
          NEW_Projects!NEW_Vehicles_project_id_fkey (
            id,
            project_code,
            NEW_Clients!NEW_Projects_client_id_fkey (
              name
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error creating NEW vehicle:', error);
        throw error;
      }

      // Transform the data to match our interface
      return {
        ...data,
        estado_pago: data.estado_pago as 'pagada' | 'no_pagada' | 'pendiente',
        projects: data.NEW_Projects ? {
          id: data.NEW_Projects.id,
          name: data.NEW_Projects.project_code || '',
          code: data.NEW_Projects.project_code || '',
          clients: data.NEW_Projects.NEW_Clients ? {
            name: data.NEW_Projects.NEW_Clients.name || ''
          } : null
        } : null
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-vehicles'] });
      toast.success('Vehículo (NUEVO) creado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating NEW vehicle:', error);
      toast.error('Error al crear el vehículo (NUEVO)');
    },
  });
};

export const useUpdateNewVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewVehicleFormData> }): Promise<NewVehicle> => {
      // Handle empty string fecha_pago - convert to null
      const cleanedData = {
        ...data,
        fecha_pago: data.fecha_pago === '' ? null : data.fecha_pago
      };

      const { data: updatedData, error } = await supabase
        .from('NEW_Vehicles')
        .update(cleanedData)
        .eq('id', id)
        .select(`
          *,
          NEW_Projects!NEW_Vehicles_project_id_fkey (
            id,
            project_code,
            NEW_Clients!NEW_Projects_client_id_fkey (
              name
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error updating NEW vehicle:', error);
        throw error;
      }

      // Transform the data to match our interface
      return {
        ...updatedData,
        estado_pago: updatedData.estado_pago as 'pagada' | 'no_pagada' | 'pendiente',
        projects: updatedData.NEW_Projects ? {
          id: updatedData.NEW_Projects.id,
          name: updatedData.NEW_Projects.project_code || '',
          code: updatedData.NEW_Projects.project_code || '',
          clients: updatedData.NEW_Projects.NEW_Clients ? {
            name: updatedData.NEW_Projects.NEW_Clients.name || ''
          } : null
        } : null
      };
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['new-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['unified-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      toast.success('Vehículo (NUEVO) actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating NEW vehicle:', error);
      toast.error('Error al actualizar el vehículo (NUEVO)');
    },
  });
};

export const useDeleteNewVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('NEW_Vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting NEW vehicle:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-vehicles'] });
      toast.success('Vehículo (NUEVO) eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting NEW vehicle:', error);
      toast.error('Error al eliminar el vehículo (NUEVO)');
    },
  });
};

export const useAssignNewVehicleToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, projectId }: {
      vehicleId: string;
      projectId?: string;
    }): Promise<void> => {
      logger.vehicle.assign(vehicleId, projectId || 'unassign');

      // Usar función RPC para operaciones atómicas
      // IMPORTANTE: No usar || null aquí, ya que projectId puede ser undefined intencionalmente
      const { error } = await supabase.rpc('assign_vehicle_to_project_atomic', {
        p_vehicle_id: vehicleId,
        p_project_id: projectId === undefined ? null : projectId
      });

      if (error) {
        console.error('❌ Error in atomic vehicle assignment:', error);
        throw error;
      }

      logger.debug('Vehicle assignment completed atomically', { component: 'Vehicle', data: { vehicleId, projectId } });
    },
    onSuccess: (_, variables) => {
      // Invalidación optimizada para múltiples queries
      queryClient.invalidateQueries({
        queryKey: ['new-vehicles'],
        exact: false
      });

      // También invalidar production slots para que se actualice la planificación
      queryClient.invalidateQueries({
        queryKey: ['production-slots'],
        exact: false
      });

      // Invalidar proyectos unificados
      queryClient.invalidateQueries({
        queryKey: ['unified-projects'],
        exact: false
      });

      const message = variables.projectId
        ? 'Vehículo asignado exitosamente'
        : 'Vehículo liberado exitosamente';

      toast.success(message);
    },
    onError: (error) => {
      console.error('Error in vehicle assignment:', error);
      toast.error('Error al gestionar la asignación del vehículo');
    },
  });
};

// Función auxiliar para manejo manual de transacciones
async function manualVehicleAssignment(vehicleId: string, projectId?: string) {
  if (projectId) {
    // Operación 1: Verificar disponibilidad del proyecto
    const { data: projectCheck, error: checkError } = await supabase
      .from('NEW_Projects')
      .select('vehicle_id')
      .eq('id', projectId)
      .single();

    if (checkError) throw checkError;

    // Operación 2: Liberar vehículo anterior del proyecto si existe
    if (projectCheck.vehicle_id && projectCheck.vehicle_id !== vehicleId) {
      const { error: clearError } = await supabase
        .from('NEW_Vehicles')
        .update({ project_id: null })
        .eq('id', projectCheck.vehicle_id);

      if (clearError) throw clearError;
    }

    // Operación 3: Asignar nuevo vehículo
    const { error: assignError } = await supabase
      .from('NEW_Vehicles')
      .update({ project_id: projectId })
      .eq('id', vehicleId);

    if (assignError) throw assignError;
  } else {
    // Solo desasignar
    const { error } = await supabase
      .from('NEW_Vehicles')
      .update({ project_id: null })
      .eq('id', vehicleId);

    if (error) throw error;
  }
}