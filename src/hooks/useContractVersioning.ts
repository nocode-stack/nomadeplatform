import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContractData {
  id?: string;
  project_id: string;
  client_id: string;
  budget_id?: string;
  contract_type: string;
  client_full_name: string;
  client_dni: string;
  client_email: string;
  client_phone: string;
  billing_entity_name: string;
  billing_entity_nif: string;
  billing_address: string;
  vehicle_model: string;
  vehicle_vin: string;
  vehicle_plate: string;
  total_price: number;
  payment_reserve?: number;
  payment_conditions: string;
  iban: string;
  signaturit_id?: string;
  signed_pdf_url?: string;
  vehicle_engine?: string;
  delivery_months?: number;
  payment_first_percentage?: number;
  payment_first_amount?: number;
  payment_second_percentage?: number;
  payment_second_amount?: number;
  payment_third_percentage?: number;
  payment_third_amount?: number;
}

export const useContractVersioning = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutación optimizada para generar contrato usando la función de BD
  const generateContract = useMutation({
    mutationFn: async ({ contractData, contractType, p_project_id }: { contractData: ContractData; contractType: string; p_project_id?: string }) => {
      // removed debug log
      const activeProjectId = p_project_id || projectId;
      // removed debug log

      if (!activeProjectId) {
        console.error('❌ Error: No se proporcionó un ID de proyecto válido');
        throw new Error('No se pudo determinar el ID del proyecto para generar el contrato.');
      }

      // Obtener datos actuales del proyecto con vehículo, cliente y presupuesto
      // removed debug log
      const { data: projectData, error: projectError } = await supabase
        .from('NEW_Projects')
        .select(`
          *,
          new_clients:NEW_Clients(*),
          new_vehicles:NEW_Vehicles(*),
          budgets:NEW_Budget(
            *,
            engine_option:engine_options(*),
            model_option:model_options(*),
            exterior_color:exterior_color_options(*),
            interior_color_option:interior_color_options(*)
          )
        `)
        .eq('id', activeProjectId)
        .single();

      if (projectError) {
        console.warn('⚠️ Non-fatal error fetching project data, will try fallback data:', projectError);
      } else {
        // removed debug log
      }

      // Obtener datos de facturación
      let billingData: any = null;
      if (contractData.client_id) {
        try {
          // removed debug log
          const { data: bData } = await supabase
            .from('NEW_Billing')
            .select('*')
            .eq('client_id', contractData.client_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          billingData = bData;
          // removed debug log
        } catch (e) {
          console.warn('⚠️ Error fetching billing data:', e);
        }
      }

      // Preparar datos combinados con información correcta del modelo
      const primaryBudget = projectData?.budgets?.find(b => b.is_primary) || projectData?.budgets?.[0];

      const vehicleModel = contractData.vehicle_model ||
        primaryBudget?.model_option?.name ||
        (projectData?.new_vehicles as any)?.model ||
        'Modelo pendiente';

      // Construir el objeto de datos que se enviará al RPC
      // NOTA: Favorecemos los datos pasados explícitamente en contractData
      const combinedData = {
        client_id: contractData.client_id,
        client_full_name: contractData.client_full_name || projectData?.new_clients?.name || projectData?.client_name || '',
        client_dni: contractData.client_dni || projectData?.new_clients?.dni || 'N/A',
        client_email: contractData.client_email || projectData?.new_clients?.email || '',
        client_phone: contractData.client_phone || projectData?.new_clients?.phone || '',
        billing_entity_name: contractData.billing_entity_name || (billingData?.name !== (projectData?.new_clients?.name || contractData.client_full_name) ? billingData?.name : null),
        billing_entity_nif: contractData.billing_entity_nif || billingData?.nif || null,
        billing_address: contractData.billing_address || billingData?.billing_address || projectData?.new_clients?.address || 'Dirección pendiente',
        budget_id: contractData.budget_id || primaryBudget?.id || null,
        vehicle_model: vehicleModel,
        vehicle_vin: contractData.vehicle_vin || projectData?.new_vehicles?.numero_bastidor || '',
        vehicle_plate: contractData.vehicle_plate || projectData?.new_vehicles?.matricula || '',
        vehicle_engine: contractData.vehicle_engine || primaryBudget?.engine_option?.name || projectData?.new_vehicles?.engine || '',
        total_price: contractData.total_price || primaryBudget?.total || 0,
        payment_reserve: contractData.payment_reserve || 0,
        payment_conditions: contractData.payment_conditions || '',
        iban: contractData.iban || '',
        delivery_months: contractData.delivery_months || 0,
        payment_first_percentage: contractData.payment_first_percentage || 0,
        payment_first_amount: contractData.payment_first_amount || 0,
        payment_second_percentage: contractData.payment_second_percentage || 0,
        payment_second_amount: contractData.payment_second_amount || 0,
        payment_third_percentage: contractData.payment_third_percentage || 0,
        payment_third_amount: contractData.payment_third_amount || 0
      };

      // Validar datos mínimos obligatorios
      if (!combinedData.client_full_name?.trim()) {
        // removed debug log
        throw new Error('El nombre del cliente es obligatorio para generar un contrato.');
      }

      // Validar client_id para evitar errores de casting en la base de datos (UUID)
      const sanitizedClientId = (combinedData.client_id && typeof combinedData.client_id === 'string' && combinedData.client_id.trim() !== '')
        ? combinedData.client_id
        : null;

      if (!sanitizedClientId) {
        console.warn('⚠️ Warning: No valid client_id found for contract');
      }

      const rpcPayload = {
        p_project_id: activeProjectId,
        p_contract_type: contractType,
        p_contract_data: {
          ...combinedData,
          client_id: sanitizedClientId
        }
      };

      // removed debug log

      const { data, error } = await supabase.rpc('generate_contract_version', rpcPayload);

      if (error) {
        console.error('❌ Supabase RPC Error (generate_contract_version):', error.code, error.message);
        throw error;
      }

      // removed debug log
      return data;
    },
    onSuccess: (_, variables) => {
      const activeProjectId = variables.p_project_id || projectId;
      if (activeProjectId) {
        queryClient.invalidateQueries({ queryKey: ['contractStatuses', activeProjectId] });
        queryClient.invalidateQueries({ queryKey: ['contract', activeProjectId] });
      }

      toast({
        title: "Contrato generado",
        description: "El contrato se ha generado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error generating contract:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el contrato.",
        variant: "destructive",
      });
    }
  });

  // Mutación para cambiar a modo edición
  const setEditMode = useMutation({
    mutationFn: async (contractType: string) => {
      const { error } = await supabase
        .from('NEW_Contracts')
        .update({ estado_visual: 'editing' })
        .eq('project_id', projectId)
        .eq('contract_type', contractType)
        .eq('is_latest', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractStatuses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['contract', projectId] });
    },
    onError: (error) => {
      console.error('Error setting edit mode:', error);
      toast({
        title: "Error",
        description: "No se pudo activar el modo edición.",
        variant: "destructive",
      });
    }
  });

  // Mutación para enviar contrato
  const sendContract = useMutation({
    mutationFn: async (contractType: string) => {
      // removed debug log

      // Verificar qué contrato se va a actualizar
      const { data: contractToUpdate } = await supabase
        .from('NEW_Contracts')
        .select('id, version, estado_visual')
        .eq('project_id', projectId)
        .eq('contract_type', contractType)
        .eq('is_latest', true)
        .eq('is_active', true)
        .single();

      // removed debug log

      if (!contractToUpdate) {
        throw new Error('No contract found to send');
      }

      // Solo hacer UPDATE del estado, nunca INSERT
      const { error } = await supabase
        .from('NEW_Contracts')
        .update({
          estado_visual: 'sent',
          contract_status: 'sent' // Explicit para evitar confusión con trigger
        })
        .eq('id', contractToUpdate.id); // Usar ID específico, no filtros múltiples

      // removed debug log

      if (error) throw error;
    },
    onSuccess: () => {
      // Solo invalidar la query principal, con debounce implícito
      queryClient.invalidateQueries({ queryKey: ['contractStatuses', projectId] });
      toast({
        title: "Contrato enviado",
        description: "El contrato ha sido enviado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error sending contract:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el contrato.",
        variant: "destructive",
      });
    }
  });

  // Mutación optimizada para autoguardado con debounce inteligente
  const autoSave = useMutation({
    mutationFn: async ({ contractData, existingContractId }: { contractData: ContractData; existingContractId: string }) => {
      // Filtrar solo campos que han cambiado y no están vacíos
      const updateData: Record<string, unknown> = {};

      // Solo actualizar campos con valores válidos
      if (contractData.total_price !== undefined && contractData.total_price >= 0) {
        updateData.total_price = contractData.total_price;
      }
      if (contractData.payment_reserve !== undefined && contractData.payment_reserve >= 0) {
        updateData.payment_reserve = contractData.payment_reserve;
      }
      if (contractData.payment_conditions && contractData.payment_conditions.trim()) {
        updateData.payment_conditions = contractData.payment_conditions;
      }
      if (contractData.delivery_months !== undefined && contractData.delivery_months >= 0) {
        updateData.delivery_months = contractData.delivery_months;
      }

      // Campos de pagos solo si tienen valores válidos
      if (contractData.payment_first_percentage !== undefined && contractData.payment_first_percentage >= 0) {
        updateData.payment_first_percentage = contractData.payment_first_percentage;
      }
      if (contractData.payment_first_amount !== undefined && contractData.payment_first_amount >= 0) {
        updateData.payment_first_amount = contractData.payment_first_amount;
      }
      if (contractData.payment_second_percentage !== undefined && contractData.payment_second_percentage >= 0) {
        updateData.payment_second_percentage = contractData.payment_second_percentage;
      }
      if (contractData.payment_second_amount !== undefined && contractData.payment_second_amount >= 0) {
        updateData.payment_second_amount = contractData.payment_second_amount;
      }
      if (contractData.payment_third_percentage !== undefined && contractData.payment_third_percentage >= 0) {
        updateData.payment_third_percentage = contractData.payment_third_percentage;
      }
      if (contractData.payment_third_amount !== undefined && contractData.payment_third_amount >= 0) {
        updateData.payment_third_amount = contractData.payment_third_amount;
      }

      // Solo hacer update si hay campos para actualizar
      if (Object.keys(updateData).length === 0) {
        return; // No hay nada que actualizar
      }

      const { data: updatedContract, error } = await supabase
        .from('NEW_Contracts')
        .update(updateData)
        .eq('id', existingContractId)
        .select()
        .single();

      if (error) throw error;
      return updatedContract;
    },
    onSuccess: () => {
      // Solo invalidar contractStatuses para evitar flickering
      queryClient.invalidateQueries({ queryKey: ['contractStatuses', projectId] });
    },
    onError: (error) => {
      console.error('Error auto-saving contract:', error);
    }
  });

  return {
    generateContract,
    setEditMode,
    sendContract,
    autoSave
  };
};
