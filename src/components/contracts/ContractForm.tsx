import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Input } from '../ui/input';
import { NumericInput } from '../ui/numeric-input';
import { Label } from '../ui/label';
// Textarea removed (unused)
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { useContractVersioning } from '../../hooks/useContractVersioning';
import { useVehicleSpecsComparison } from '../../hooks/useVehicleSpecsComparison';
import { VehicleSpecsAlert } from './VehicleSpecsAlert';
import { Loader2, AlertTriangle, CheckCircle, Clock, Save } from 'lucide-react';

interface Project {
  id: string;
  code?: string;
  name?: string;
  clients?: {
    id?: string;
    name?: string;
    surname?: string;
    email?: string;
    dni?: string;
    phone?: string;
    address?: string;
    address_number?: string;
    city?: string;
    autonomous_community?: string;
    country?: string;
  };
  vehicles?: {
    id?: string;
    vehicle_code?: string;
    numero_bastidor?: string;
    matricula?: string;
    engine?: string;
    transmission_type?: string;
    plazas?: string;
    exterior_color?: string;
    dimensions?: string;
  };
}

interface ContractFormProps {
  project: Project;
  contractType: string;
  status: string;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
  onFormDataChange?: (formData: ContractData) => void;
  onProgressChange?: (progress: number) => void;
}

interface ContractData {
  id?: string;
  project_id: string;
  client_id: string;
  contract_type: string;
  contract_status: string;
  client_full_name: string;
  client_surname: string;
  client_dni: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  billing_entity_name: string;
  billing_entity_nif: string;
  billing_address: string;
  vehicle_model: string;
  vehicle_vin: string;
  vehicle_plate: string;
  total_price: number;
  payment_reserve?: number;
  payment_second?: number;
  payment_final?: number;
  payment_conditions: string;
  iban: string;
  signaturit_id?: string;
  signed_pdf_url?: string;
  // Nuevos campos específicos por tipo de contrato
  vehicle_engine?: string;
  delivery_months?: number;
  // Campos para sistema de pagos detallado
  payment_first_percentage?: number;
  payment_first_amount?: number;
  payment_second_percentage?: number;
  payment_second_amount?: number;
  payment_third_percentage?: number;
  payment_third_amount?: number;
  // Contrato final: último pago manual
  payment_last_manual?: number;
  // Campo interno para saber el tipo de facturación
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const ContractForm: React.FC<ContractFormProps> = ({
  project,
  contractType,
  status,
  isEditMode = false,
  onEditModeChange,
  onFormDataChange,
  onProgressChange
}) => {
  const _isEditMode = isEditMode;
  const _onEditModeChange = onEditModeChange;
  const { toast: _toast } = useToast();
  const { autoSave } = useContractVersioning(project.id);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ContractData>({
    project_id: project.id,
    client_id: project.clients?.id || '',
    contract_type: contractType,
    contract_status: 'draft',
    client_full_name: '',
    client_surname: '',
    client_dni: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    billing_entity_name: '',
    billing_entity_nif: '',
    billing_address: '',
    vehicle_model: '',
    vehicle_vin: '',
    vehicle_plate: '',
    total_price: 0,
    payment_reserve: 0,
    payment_conditions: '',
    iban: 'ES80 0081 7011 1900 0384 8192',
    vehicle_engine: '',
    delivery_months: 0,
    payment_first_percentage: 20,
    payment_first_amount: 0,
    payment_second_percentage: 60,
    payment_second_amount: 0,
    payment_third_percentage: 0,
    payment_third_amount: 0
  });

  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Cargar presupuesto primario para actualizar el precio total
  const { data: primaryBudget } = useQuery({
    queryKey: ['primaryBudget', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget')
        .select(`
          total,
          total_with_iedmt,
          model_option_id,
          model_options(name),
          engine_option:engine_options(name)
        `)
        .eq('client_id', project.id)
        .eq('is_primary', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching primary budget:', error);
        return null;
      }

      // Log removed for CI
      return data;
    },
    enabled: !!project.id
  });

  // Datos del vehículo desde las props del proyecto
  const vehicleData = project.vehicles || project.vehicles || null;

  // Cargar contrato de reserva para encargo y compraventa_final
  const { data: reservationContract } = useQuery({
    queryKey: ['reservationContract', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('payment_reserve')
        .eq('project_id', project.id)
        .eq('contract_type', 'reserva')
        .eq('is_latest', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching reservation contract:', error);
        return null;
      }

      return data;
    },
    enabled: contractType === 'encargo' || contractType === 'compraventa_final'
  });

  // Cargar contrato de encargo para compraventa_final (pago de encargo = payment_first_amount)
  const { data: encargoContract } = useQuery({
    queryKey: ['encargoContract', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('payment_first_amount')
        .eq('project_id', project.id)
        .eq('contract_type', 'encargo')
        .eq('is_latest', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching encargo contract:', error);
        return null;
      }

      return data;
    },
    enabled: contractType === 'compraventa_final'
  });

  // Cargar contrato activo existente - ÚNICA FUENTE DE VERDAD
  const { data: existingContract, isLoading } = useQuery({
    queryKey: ['contract', project.id, contractType],
    queryFn: async () => {
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('project_id', project.id)
        .eq('contract_type', contractType)
        .eq('is_latest', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractError) {
        console.error('Error fetching contract:', contractError);
        return null;
      }

      return contractData;
    },
    enabled: !!project.id && !!contractType
  });

  // Fetch existing sibling contracts (other types) to pre-fill shared fields
  const { data: siblingContract } = useQuery({
    queryKey: ['siblingContract', project.id, contractType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('project_id', project.id)
        .neq('contract_type', contractType)
        .eq('is_latest', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching sibling contract:', error);
        return null;
      }
      return data;
    },
    enabled: !!project.id && !!contractType
  });

  // Query separada para obtener datos del cliente y facturación
  const { data: clientBillingData } = useQuery({
    queryKey: ['clientBilling', project.clients?.id],
    queryFn: async () => {
      if (!project.clients?.id) return null;

      const [clientResult, billingResult] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('id', project.clients.id)
          .single(),
        supabase
          .from('billing')
          .select('*')
          .eq('client_id', project.clients.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      return {
        client: clientResult.data,
        billing: billingResult.data
      };
    },
    enabled: !!project.clients?.id,
    staleTime: 0,
  });

  // Real-time subscription para mantener el formulario actualizado
  useEffect(() => {
    if (!project.id || !contractType) return;

    const channel = supabase
      .channel('contract-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts',
          filter: `project_id=eq.${project.id}`
        },
        (_payload: unknown) => {
          // Log removed for CI
          // Invalidar query para refrescar datos
          queryClient.invalidateQueries({
            queryKey: ['contract', project.id, contractType]
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        () => {
          // Log removed for CI
          queryClient.invalidateQueries({
            queryKey: ['clientBilling', project.clients?.id]
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing'
        },
        () => {
          // Billing data updated, refreshing contract form
          queryClient.invalidateQueries({
            queryKey: ['clientBilling', project.clients?.id]
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, contractType, queryClient, project.clients?.id]);

  // Helper para construir dirección concatenada
  const _buildConcatenatedAddress = (parts: { address?: string; address_number?: string; city?: string; autonomous_community?: string; country?: string }) => {
    const pieces = [
      [parts.address, parts.address_number].filter(Boolean).join(' '),
      parts.city,
      parts.autonomous_community,
      parts.country
    ].filter(Boolean);
    return pieces.join(', ');
  };

  // Extraer tipo de facturación de los datos de billing
  const billingType = (clientBillingData?.billing as any)?.type === 'company' ? 'company' : 'personal';

  // Inicializar formulario con datos del contrato existente o datos base
  useEffect(() => {
    if (existingContract && !formData.id) {
      // Cargar contrato existente, rellenando campos vacíos desde contratos hermanos
      const sibling = siblingContract as any;
      const ec = existingContract as any;
      const isCompany = billingType === 'company';
      const b = clientBillingData?.billing as any;
      const cl = project.clients;

      setFormData({
        ...ec,
        // Para personal/other_person, datos del contrato vienen de billing
        client_surname: ec.client_surname || (isCompany ? (cl?.surname || '') : (b?.surname || '')),
        // Campos individuales de dirección
        client_country: ec.client_country || (isCompany ? (cl?.country || '') : (b?.country || '')),
        client_autonomous_community: ec.client_autonomous_community || (isCompany ? (cl?.autonomous_community || '') : (b?.autonomous_community || '')),
        client_city: ec.client_city || (isCompany ? (cl?.city || '') : (b?.city || '')),
        client_address_street: ec.client_address_street || (isCompany ? (cl?.address || '') : (b?.address_street || b?.billing_address || '')),
        client_address_number: ec.client_address_number || (isCompany ? (cl?.address_number || '') : (b?.office_unit || '')),
        payment_reserve: existingContract.payment_reserve || 0,
        vehicle_engine: existingContract.vehicle_engine || sibling?.vehicle_engine || '',
        delivery_months: existingContract.delivery_months || 0,
        payment_first_percentage: existingContract.payment_first_percentage || 0,
        payment_first_amount: existingContract.payment_first_amount || 0,
        payment_second_percentage: existingContract.payment_second_percentage || 0,
        payment_second_amount: existingContract.payment_second_amount || 0,
        payment_third_percentage: existingContract.payment_third_percentage || 0,
        payment_third_amount: existingContract.payment_third_amount || 0,
        // Fill empty shared fields from sibling contracts
        billing_entity_name: existingContract.billing_entity_name || sibling?.billing_entity_name || '',
        billing_entity_nif: existingContract.billing_entity_nif || sibling?.billing_entity_nif || '',
        billing_address: existingContract.billing_address || sibling?.billing_address || '',
        // Campos individuales de dirección de facturación (empresa)
        billing_country: ec.billing_country || (billingType === 'company' ? ((clientBillingData?.billing as any)?.country || '') : ''),
        billing_autonomous_community: ec.billing_autonomous_community || (billingType === 'company' ? ((clientBillingData?.billing as any)?.autonomous_community || '') : ''),
        billing_city: ec.billing_city || (billingType === 'company' ? ((clientBillingData?.billing as any)?.city || '') : ''),
        billing_address_street: ec.billing_address_street || (billingType === 'company' ? ((clientBillingData?.billing as any)?.address_street || '') : ''),
        billing_office_unit: ec.billing_office_unit || (billingType === 'company' ? ((clientBillingData?.billing as any)?.office_unit || '') : ''),
        vehicle_vin: existingContract.vehicle_vin || sibling?.vehicle_vin || '',
        vehicle_plate: existingContract.vehicle_plate || sibling?.vehicle_plate || '',
        vehicle_model: existingContract.vehicle_model || sibling?.vehicle_model || '',
        iban: existingContract.iban || sibling?.iban || 'ES80 0081 7011 1900 0384 8192',
      });
    } else if (!isLoading && !existingContract && clientBillingData && !formData.id) {
      // Inicializar con datos del cliente y facturación si no hay contrato
      const { client, billing } = clientBillingData;
      const sibling = siblingContract as any;
      const b = billing as any;

      // Para personal/other_person, los datos del contrato vienen de billing
      // Para company, los datos del cliente vienen de clients y los de empresa de billing
      const isCompany = billingType === 'company';
      const srcName = isCompany ? (client?.name || '') : (billing?.name || client?.name || '');
      const srcSurname = isCompany ? (client?.surname || project.clients?.surname || '') : (b?.surname || '');
      const srcDni = isCompany ? (client?.dni || '') : (billing?.nif || client?.dni || '');
      const srcEmail = isCompany ? (client?.email || '') : (billing?.email || client?.email || '');
      const srcPhone = isCompany ? (client?.phone || '') : (billing?.phone || client?.phone || '');
      const srcCountry = isCompany ? (client?.country || project.clients?.country || '') : (b?.country || '');
      const srcAC = isCompany ? (client?.autonomous_community || project.clients?.autonomous_community || '') : (b?.autonomous_community || '');
      const srcCity = isCompany ? (client?.city || project.clients?.city || '') : (b?.city || '');
      const srcStreet = isCompany ? (client?.address || project.clients?.address || '') : (b?.address_street || billing?.billing_address || '');
      const srcNumber = isCompany ? (client?.address_number || project.clients?.address_number || '') : (b?.office_unit || '');

      setFormData(prev => ({
        ...prev,
        project_id: project.id,
        client_id: client?.id || '',
        contract_type: contractType,
        client_full_name: sibling?.client_full_name || srcName,
        client_surname: sibling?.client_surname || srcSurname,
        client_dni: sibling?.client_dni || srcDni,
        client_email: sibling?.client_email || srcEmail,
        client_phone: sibling?.client_phone || srcPhone,
        // Campos individuales de dirección
        client_country: sibling?.client_country || srcCountry,
        client_autonomous_community: sibling?.client_autonomous_community || srcAC,
        client_city: sibling?.client_city || srcCity,
        client_address_street: sibling?.client_address_street || srcStreet,
        client_address_number: sibling?.client_address_number || srcNumber,
        billing_entity_name: sibling?.billing_entity_name || (isCompany ? (billing?.name || '') : ''),
        billing_entity_nif: sibling?.billing_entity_nif || billing?.nif || '',
        billing_address: sibling?.billing_address || (isCompany ? (b?.billing_address || '') : (billing?.billing_address || client?.address || '')),
        // Campos individuales de dirección de facturación (empresa)
        billing_country: sibling?.billing_country || (isCompany ? (b?.country || '') : ''),
        billing_autonomous_community: sibling?.billing_autonomous_community || (isCompany ? (b?.autonomous_community || '') : ''),
        billing_city: sibling?.billing_city || (isCompany ? (b?.city || '') : ''),
        billing_address_street: sibling?.billing_address_street || (isCompany ? (b?.address_street || '') : ''),
        billing_office_unit: sibling?.billing_office_unit || (isCompany ? (b?.office_unit || '') : ''),
        iban: sibling?.iban || 'ES80 0081 7011 1900 0384 8192',
        vehicle_vin: sibling?.vehicle_vin || prev.vehicle_vin,
        vehicle_plate: sibling?.vehicle_plate || prev.vehicle_plate,
        vehicle_engine: sibling?.vehicle_engine || prev.vehicle_engine,
        vehicle_model: sibling?.vehicle_model || prev.vehicle_model,
      }));
    }
  }, [isLoading, existingContract, clientBillingData, siblingContract, project.id, contractType, formData.id]);

  // Actualizar datos del cliente y facturación cuando cambien
  useEffect(() => {
    if (existingContract && clientBillingData && formData.id) {
      const { client, billing } = clientBillingData;
      const b = billing as any;

      // Para personal/other_person, datos del contrato vienen de billing
      const isCompany = billingType === 'company';

      setFormData(prev => ({
        ...prev,
        client_full_name: isCompany ? (client?.name || prev.client_full_name) : (billing?.name || prev.client_full_name),
        client_surname: isCompany ? (client?.surname || project.clients?.surname || prev.client_surname) : (b?.surname || prev.client_surname),
        client_dni: isCompany ? (client?.dni || prev.client_dni) : (billing?.nif || prev.client_dni),
        client_email: isCompany ? (client?.email || prev.client_email) : (billing?.email || prev.client_email),
        client_phone: isCompany ? (client?.phone || prev.client_phone) : (billing?.phone || prev.client_phone),
        // Campos individuales de dirección
        client_country: isCompany ? (client?.country || project.clients?.country || prev.client_country) : (b?.country || prev.client_country),
        client_autonomous_community: isCompany ? (client?.autonomous_community || project.clients?.autonomous_community || prev.client_autonomous_community) : (b?.autonomous_community || prev.client_autonomous_community),
        client_city: isCompany ? (client?.city || project.clients?.city || prev.client_city) : (b?.city || prev.client_city),
        client_address_street: isCompany ? (client?.address || project.clients?.address || prev.client_address_street) : (b?.address_street || billing?.billing_address || prev.client_address_street),
        client_address_number: isCompany ? (client?.address_number || project.clients?.address_number || prev.client_address_number) : (b?.office_unit || prev.client_address_number),
        billing_entity_name: isCompany ? (billing?.name || prev.billing_entity_name) : prev.billing_entity_name,
        billing_entity_nif: billing?.nif || prev.billing_entity_nif,
        billing_address: isCompany ? (b?.billing_address || prev.billing_address) : (billing?.billing_address || client?.address || prev.billing_address),
        // Campos individuales de dirección de facturación (empresa)
        billing_country: isCompany ? (b?.country || prev.billing_country) : prev.billing_country,
        billing_autonomous_community: isCompany ? (b?.autonomous_community || prev.billing_autonomous_community) : prev.billing_autonomous_community,
        billing_city: isCompany ? (b?.city || prev.billing_city) : prev.billing_city,
        billing_address_street: isCompany ? (b?.address_street || prev.billing_address_street) : prev.billing_address_street,
        billing_office_unit: isCompany ? (b?.office_unit || prev.billing_office_unit) : prev.billing_office_unit,
      }));
    }
  }, [clientBillingData, existingContract, formData.id]);

  // Notify parent when formData is initialized (so Save/Send buttons work)
  useEffect(() => {
    if (onFormDataChange && formData.client_full_name) {
      onFormDataChange(formData);
    }
  }, [formData.id, formData.client_full_name]); // Only on init, not every keystroke

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehicleSpecsComparison = useVehicleSpecsComparison((vehicleData as any) ?? null, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    engine_option: primaryBudget?.engine_option as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exterior_color: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model_option: primaryBudget?.model_options as any
  });

  // Actualizar precio total desde presupuesto primario (usa total_with_iedmt que incluye IEDMT)
  useEffect(() => {
    if (primaryBudget && (contractType === 'encargo' || contractType === 'compraventa_final')) {
      // Prefer total_with_iedmt (includes IEDMT), fallback to total
      const realTotal = primaryBudget.total_with_iedmt && Number(primaryBudget.total_with_iedmt) > 0
        ? Number(primaryBudget.total_with_iedmt)
        : Number(primaryBudget.total || 0);
      const roundedTotal = Math.round(realTotal * 100) / 100;
      setFormData(prev => ({
        ...prev,
        total_price: roundedTotal
      }));
    }
  }, [primaryBudget, contractType]);

  // Actualizar campos del vehículo desde datos del vehículo del proyecto
  useEffect(() => {
    if (vehicleData) {
      setFormData(prev => ({
        ...prev,
        // NO actualizar vehicle_model aquí ya que debe venir del presupuesto
        vehicle_engine: vehicleData.engine || prev.vehicle_engine,
        vehicle_vin: vehicleData.numero_bastidor || prev.vehicle_vin,
        vehicle_plate: vehicleData.matricula || prev.vehicle_plate
      }));
    }
  }, [vehicleData]);

  // Actualizar model y motorización desde presupuesto primario
  useEffect(() => {
    // Primary budget effect triggered
    if (primaryBudget) {
      // Obtener el nombre del modelo desde la relación model_options
      const modelName = primaryBudget.model_options?.name || 'Modelo pendiente de especificar';
      // Model name resolved from budget

      // Construir la descripción del motor desde engine_option
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engineOption = primaryBudget.engine_option as any;
      const engineDesc = engineOption?.name || '';

      setFormData(prev => ({
        ...prev,
        vehicle_model: modelName,
        // Solo rellenar vehicle_engine si está vacío (no sobreescribir datos de un contrato existente)
        vehicle_engine: prev.vehicle_engine || engineDesc
      }));
    }
  }, [primaryBudget]);

  // Usar el autoSave del hook unificado

  // Autoguardar optimizado - solo en modo edición con debounce inteligente
  useEffect(() => {
    if (existingContract?.id && formData && status === 'editing') {
      const timer = setTimeout(() => {
        if (!autoSave.isPending) {
          // Auto-saving contract
          autoSave.mutate({
            contractData: formData,
            existingContractId: existingContract.id
          });
        }
      }, 2000); // Reducido a 2 segundos para auto-save más responsivo

      return () => clearTimeout(timer);
    }
  }, [formData, existingContract?.id, status, autoSave]);

  // Usar generateContract del hook unificado

  const handleInputChange = (field: keyof ContractData, value: string | number) => {
    const newFormData = {
      ...formData,
      [field]: value
    };

    setFormData(newFormData);

    // Notificar al padre sobre el cambio
    if (onFormDataChange) {
      onFormDataChange(newFormData);
    }

    // Limpiar el campo de la lista de campos faltantes si se está completando
    if (value && missingFields.includes(field)) {
      setMissingFields(prev => prev.filter(f => f !== field));
    }
  };

  // Función para validar campos según el tipo de contrato
  const validateFields = () => {
    const missing: string[] = [];

    // Campos básicos siempre recomendados
    if (!formData.client_full_name?.trim()) missing.push('client_full_name');
    if (!formData.client_email?.trim()) missing.push('client_email');
    if (!formData.billing_address?.trim()) missing.push('billing_address');
    // Vehicle model only required for compraventa_final
    if (contractType === 'compraventa_final' && !formData.vehicle_model?.trim()) missing.push('vehicle_model');

    // Campos específicos por tipo de contrato
    if (contractType === 'reserva' && (!formData.payment_reserve || formData.payment_reserve <= 0)) {
      missing.push('payment_reserve');
    }

    if (contractType === 'encargo' && (!formData.total_price || formData.total_price <= 0)) {
      missing.push('total_price');
    }
    if (contractType === 'encargo' && (!formData.payment_first_amount || formData.payment_first_amount <= 0)) {
      missing.push('payment_first_amount');
    }

    if (contractType === 'compraventa_final') {
      if (!formData.total_price || formData.total_price <= 0) missing.push('total_price');
      if (!formData.payment_last_manual || formData.payment_last_manual <= 0) missing.push('payment_last_manual');
    }

    setMissingFields(missing);
    return missing;
  };

  // Función para calcular automáticamente entre porcentaje y cantidad
  const handlePaymentChange = (type: 'first' | 'second' | 'third', field: 'percentage' | 'amount', value: string) => {
    const totalPrice = formData.total_price || 0;

    // Si el campo está vacío, limpiar ambos campos relacionados
    if (value === '' || value === undefined) {
      const newFormData = {
        ...formData,
        [`payment_${type}_percentage`]: 0,
        [`payment_${type}_amount`]: 0
      };
      setFormData(newFormData);
      if (onFormDataChange) {
        onFormDataChange(newFormData);
      }
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || totalPrice === 0) return;

    if (field === 'percentage') {
      const amount = (totalPrice * numericValue) / 100;
      const newFormData = {
        ...formData,
        [`payment_${type}_percentage`]: numericValue,
        [`payment_${type}_amount`]: amount
      };
      setFormData(newFormData);
      if (onFormDataChange) {
        onFormDataChange(newFormData);
      }
    } else {
      const percentage = (numericValue / totalPrice) * 100;
      const newFormData = {
        ...formData,
        [`payment_${type}_percentage`]: percentage,
        [`payment_${type}_amount`]: numericValue
      };
      setFormData(newFormData);
      if (onFormDataChange) {
        onFormDataChange(newFormData);
      }
    }
  };

  // Recalcular pagos cuando cambie el precio total
  useEffect(() => {
    const totalPrice = formData.total_price || 0;
    if (totalPrice > 0 && status === 'editing') {
      const firstPercentage = formData.payment_first_percentage || 0;
      const secondPercentage = formData.payment_second_percentage || 0;

      const newFormData = {
        ...formData,
        payment_first_amount: (totalPrice * firstPercentage) / 100,
        payment_second_amount: (totalPrice * secondPercentage) / 100
      };

      setFormData(newFormData);
      if (onFormDataChange) {
        onFormDataChange(newFormData);
      }
    }
  }, [formData.total_price, status]);


  const getFieldLabels = (fields: string[]) => {
    const labels: { [key: string]: string } = {
      client_full_name: 'Nombre del cliente',
      client_email: 'Email del cliente',
      billing_address: 'Dirección de facturación',
      vehicle_model: 'Modelo Nomade',
      payment_reserve: 'Importe de reserva',
      total_price: 'Precio total'
    };

    return fields.map(field => labels[field] || field);
  };

  // Calcular progreso de completitud basado en TODOS los campos
  const calculateProgress = () => {
    // Campos base según tipo de facturación
    let allFields: string[] = [];

    if (billingType === 'company') {
      // Empresa: sin DNI en cliente, pero con datos empresa
      allFields = [
        'client_full_name', 'client_surname', 'client_email', 'client_phone',
        'client_country', 'client_autonomous_community', 'client_city', 'client_address_street', 'client_address_number',
        'billing_entity_name', 'billing_entity_nif',
        'billing_country', 'billing_autonomous_community', 'billing_city', 'billing_address_street', 'billing_office_unit',
        'iban',
      ];
      // Vehicle fields only for compraventa_final
      if (contractType === 'compraventa_final') {
        allFields.push('vehicle_model', 'vehicle_engine');
      }
    } else {
      // Personal / Otra persona: con DNI, sin datos empresa
      allFields = [
        'client_full_name', 'client_surname', 'client_dni', 'client_email', 'client_phone',
        'client_country', 'client_autonomous_community', 'client_city', 'client_address_street', 'client_address_number',
        'iban',
      ];
      // Vehicle fields only for compraventa_final
      if (contractType === 'compraventa_final') {
        allFields.push('vehicle_model', 'vehicle_engine');
      }
    }

    // Bastidor y matrícula solo para compraventa_final
    if (contractType === 'compraventa_final') {
      allFields.push('vehicle_vin', 'vehicle_plate');
    }

    // Campos específicos según tipo de contrato
    if (contractType === 'reserva') {
      allFields.push('payment_reserve');
    } else if (contractType === 'encargo') {
      allFields.push(
        'total_price',
        'payment_first_amount' // = pago de encargo
      );
    } else if (contractType === 'compraventa_final') {
      allFields.push('total_price', 'payment_last_manual');
    }

    // Contar campos completados
    const completedFields = allFields.filter(field => {
      const value = formData[field];
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      if (typeof value === 'number') {
        return value > 0;
      }
      return false;
    });

    return Math.round((completedFields.length / allFields.length) * 100);
  };

  // Obtener icono de estado
  const getStatusIcon = () => {
    switch (status) {
      case 'generated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'editing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Obtener texto de estado
  const getStatusDescription = () => {
    if (status === 'editing') {
      return 'Editando contrato - modifica los campos necesarios';
    }

    switch (status) {
      case 'draft':
        return 'Completar datos y generar el contrato';
      case 'generated':
        return 'Contrato generado y listo para enviar';
      case 'sent':
        return 'Contrato enviado al cliente';
      case 'signed':
        return 'Contrato firmado por el cliente';
      default:
        return 'Estado desconocido';
    }
  };

  // Determinar si un campo específico debe ser readonly
  // TODOS los campos son siempre editables en el formulario
  const isFieldReadOnly = (_fieldName: string) => {
    return false;
  };

  // Helper: determinar si un campo está vacío para resaltarlo visualmente
  const isFieldEmpty = (field: keyof ContractData) => {
    const value = formData[field];
    if (typeof value === 'string') return !value || value.trim() === '';
    if (typeof value === 'number') return value === 0;
    return !value;
  };

  // Helper: devolver clases CSS para campos vacíos (amber) vs rellenos
  const getFieldStyle = (field: keyof ContractData, extraClass = '') => {
    const empty = isFieldEmpty(field);
    const base = isFieldReadOnly(field as string) ? 'bg-muted' : '';
    const highlight = empty ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : '';
    return `${base} ${highlight} ${extraClass}`.trim();
  };


  // Función para formatear valores de input que pueden estar vacíos
  const formatInputValue = (value: number | undefined | null) => {
    if (value === null || value === undefined || value === 0) return '';
    // Redondear a 2 decimales para evitar problemas de precisión
    return Number(value).toFixed(2);
  };

  // Función para manejar inputs numéricos que pueden estar vacíos
  const handleNumericInputChange = (field: keyof ContractData, value: string) => {
    // Si el campo está vacío, guardar null o 0 según corresponda
    if (value === '' || value === undefined) {
      handleInputChange(field, 0);
    } else {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        handleInputChange(field, numericValue);
      }
    }
  };

  // Función para calcular el tercer pago automáticamente
  const calculateThirdPayment = () => {
    const totalPrice = formData.total_price || 0;
    const reserveAmount = reservationContract?.payment_reserve || 0;
    const firstAmount = formData.payment_first_amount || 0;
    const secondAmount = formData.payment_second_amount || 0;

    const thirdAmount = totalPrice - reserveAmount - firstAmount - secondAmount;
    const thirdPercentage = totalPrice > 0 ? (thirdAmount / totalPrice) * 100 : 0;

    return {
      amount: Math.max(0, thirdAmount),
      percentage: Math.max(0, thirdPercentage)
    };
  };

  const thirdPayment = calculateThirdPayment();

  // UseEffect para actualizar automáticamente el tercer pago en formData
  useEffect(() => {
    const totalPrice = formData.total_price || 0;
    const reserveAmount = reservationContract?.payment_reserve || 0;
    const firstAmount = formData.payment_first_amount || 0;
    const secondAmount = formData.payment_second_amount || 0;

    const calculatedThirdAmount = totalPrice - reserveAmount - firstAmount - secondAmount;
    const calculatedThirdPercentage = totalPrice > 0 ? (calculatedThirdAmount / totalPrice) * 100 : 0;

    const finalThirdAmount = Math.max(0, calculatedThirdAmount);
    const finalThirdPercentage = Math.max(0, calculatedThirdPercentage);

    // Solo actualizar si los valores han cambiado para evitar bucles infinitos
    if (formData.payment_third_amount !== finalThirdAmount ||
      formData.payment_third_percentage !== finalThirdPercentage) {

      const newFormData = {
        ...formData,
        payment_third_amount: finalThirdAmount,
        payment_third_percentage: finalThirdPercentage
      };

      setFormData(newFormData);

      // Notificar al padre sobre el cambio
      if (onFormDataChange) {
        onFormDataChange(newFormData);
      }
    }
  }, [
    formData.total_price,
    reservationContract?.payment_reserve,
    formData.payment_first_amount,
    formData.payment_second_amount,
    formData.payment_third_amount,
    formData.payment_third_percentage,
    onFormDataChange
  ]);

  const progressPercentage = calculateProgress();

  // Notificar al padre sobre cambios en el progreso
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(progressPercentage);
    }
  }, [progressPercentage, onProgressChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando datos del contrato...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estado y progreso */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusDescription()}</span>
            {autoSave.isPending && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Save className="h-3 w-3" />
                <span>Guardando...</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {progressPercentage}% completado
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso del formulario</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        {/* Leyenda de colores */}
        {progressPercentage < 100 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-block w-3 h-3 rounded border-2 border-amber-400 bg-amber-50"></span>
            <span className="text-xs text-muted-foreground">Los campos resaltados en <span className="font-semibold text-amber-600">amarillo</span> están pendientes de rellenar</span>
          </div>
        )}
      </div>

      {/* Alert de discrepancias de especificaciones - solo para acuerdo de compraventa */}
      {contractType === 'encargo' && vehicleSpecsComparison.hasDiscrepancies && (
        <VehicleSpecsAlert discrepancies={vehicleSpecsComparison.discrepancies} className="mb-4" />
      )}

      {/* Mostrar campos faltantes si los hay */}
      {missingFields.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Campos recomendados por completar:</strong> {getFieldLabels(missingFields).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información del Cliente (columna izquierda) */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Información del Cliente</h4>

          <div>
            <Label htmlFor="client_full_name">Nombre</Label>
            <Input
              id="client_full_name"
              value={formData.client_full_name || ''}
              onChange={(e) => handleInputChange('client_full_name', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_full_name') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="client_surname">Apellidos</Label>
            <Input
              id="client_surname"
              value={formData.client_surname || ''}
              onChange={(e) => handleInputChange('client_surname', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_surname') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          {/* DNI solo para personal y other_person */}
          {billingType !== 'company' && (
            <div>
              <Label htmlFor="client_dni">DNI</Label>
              <Input
                id="client_dni"
                value={formData.client_dni || ''}
                onChange={(e) => handleInputChange('client_dni', e.target.value)}
                readOnly={true}
                placeholder="Pendiente de rellenar"
                className={`bg-muted ${isFieldEmpty('client_dni') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
              />
            </div>
          )}

          <div>
            <Label htmlFor="client_email">Email</Label>
            <Input
              id="client_email"
              type="email"
              value={formData.client_email || ''}
              onChange={(e) => handleInputChange('client_email', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_email') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="client_phone">Teléfono</Label>
            <Input
              id="client_phone"
              value={formData.client_phone || ''}
              onChange={(e) => handleInputChange('client_phone', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_phone') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="client_country">País</Label>
            <Input
              id="client_country"
              value={formData.client_country || ''}
              onChange={(e) => handleInputChange('client_country', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_country') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="client_autonomous_community">Comunidad Autónoma</Label>
            <Input
              id="client_autonomous_community"
              value={formData.client_autonomous_community || ''}
              onChange={(e) => handleInputChange('client_autonomous_community', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_autonomous_community') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="client_city">Ciudad</Label>
            <Input
              id="client_city"
              value={formData.client_city || ''}
              onChange={(e) => handleInputChange('client_city', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_city') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="client_address_street">Dirección</Label>
            <Input
              id="client_address_street"
              value={formData.client_address_street || ''}
              onChange={(e) => handleInputChange('client_address_street', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_address_street') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>

          <div>
            <Label htmlFor="client_address_number">Número</Label>
            <Input
              id="client_address_number"
              value={formData.client_address_number || ''}
              onChange={(e) => handleInputChange('client_address_number', e.target.value)}
              readOnly={true}
              placeholder="Pendiente de rellenar"
              className={`bg-muted ${isFieldEmpty('client_address_number') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
            />
          </div>
        </div>

        {/* Información de Facturación + Vehículo (columna derecha) */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Información de Facturación</h4>

          {/* Campos de empresa solo si billingType === 'company' */}
          {billingType === 'company' && (
            <>
              <div>
                <Label htmlFor="billing_entity_name">Nombre de la Empresa</Label>
                <Input
                  id="billing_entity_name"
                  value={formData.billing_entity_name || ''}
                  onChange={(e) => handleInputChange('billing_entity_name', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente de rellenar"
                  className={`bg-muted ${isFieldEmpty('billing_entity_name') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="billing_entity_nif">CIF</Label>
                <Input
                  id="billing_entity_nif"
                  value={formData.billing_entity_nif || ''}
                  onChange={(e) => handleInputChange('billing_entity_nif', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente de rellenar"
                  className={`bg-muted ${isFieldEmpty('billing_entity_nif') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="billing_country">País</Label>
                <Input
                  id="billing_country"
                  value={formData.billing_country || ''}
                  onChange={(e) => handleInputChange('billing_country', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente de rellenar"
                  className={`bg-muted ${isFieldEmpty('billing_country') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="billing_autonomous_community">Comunidad Autónoma</Label>
                <Input
                  id="billing_autonomous_community"
                  value={formData.billing_autonomous_community || ''}
                  onChange={(e) => handleInputChange('billing_autonomous_community', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente de rellenar"
                  className={`bg-muted ${isFieldEmpty('billing_autonomous_community') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="billing_city">Ciudad</Label>
                <Input
                  id="billing_city"
                  value={formData.billing_city || ''}
                  onChange={(e) => handleInputChange('billing_city', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente de rellenar"
                  className={`bg-muted ${isFieldEmpty('billing_city') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="billing_address_street">Dirección</Label>
                <Input
                  id="billing_address_street"
                  value={formData.billing_address_street || ''}
                  onChange={(e) => handleInputChange('billing_address_street', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente de rellenar"
                  className={`bg-muted ${isFieldEmpty('billing_address_street') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="billing_office_unit">Número</Label>
                <Input
                  id="billing_office_unit"
                  value={formData.billing_office_unit || ''}
                  onChange={(e) => handleInputChange('billing_office_unit', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente de rellenar"
                  className={`bg-muted ${isFieldEmpty('billing_office_unit') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban || 'ES80 0081 7011 1900 0384 8192'}
              readOnly={true}
              className="bg-muted"
            />
          </div>

          {/* Información del Vehículo — solo para Compraventa Final */}
          {contractType === 'compraventa_final' && (
            <>
              <h4 className="font-semibold text-gray-900 pt-2">Información del Vehículo</h4>

              {vehicleSpecsComparison.hasDiscrepancies && (
                <VehicleSpecsAlert
                  discrepancies={vehicleSpecsComparison.discrepancies}
                  className="mb-4"
                />
              )}

              <div>
                <Label htmlFor="vehicle_model">Modelo Nomade</Label>
                <Input
                  id="vehicle_model"
                  value={formData.vehicle_model || ''}
                  onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente — se rellenará desde el presupuesto"
                  className={`bg-muted ${isFieldEmpty('vehicle_model') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="vehicle_engine">Motorización</Label>
                <Input
                  id="vehicle_engine"
                  value={formData.vehicle_engine || ''}
                  onChange={(e) => handleInputChange('vehicle_engine', e.target.value)}
                  readOnly={true}
                  placeholder="Pendiente — se rellenará desde el presupuesto"
                  className={`bg-muted ${isFieldEmpty('vehicle_engine') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                />
              </div>

              {contractType === 'compraventa_final' && (
                <>
                  <div>
                    <Label htmlFor="vehicle_vin">Número de Bastidor</Label>
                    <Input
                      id="vehicle_vin"
                      value={formData.vehicle_vin || ''}
                      onChange={(e) => handleInputChange('vehicle_vin', e.target.value)}
                      readOnly={isFieldReadOnly('vehicle_vin')}
                      placeholder="Pendiente de rellenar"
                      className={getFieldStyle('vehicle_vin')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle_plate">Matrícula</Label>
                    <Input
                      id="vehicle_plate"
                      value={formData.vehicle_plate || ''}
                      onChange={(e) => handleInputChange('vehicle_plate', e.target.value)}
                      readOnly={isFieldReadOnly('vehicle_plate')}
                      placeholder="Pendiente de rellenar"
                      className={getFieldStyle('vehicle_plate')}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Información Específica del Contrato */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Información del Contrato</h4>

        {contractType === 'reserva' && (
          <div>
            <Label htmlFor="payment_reserve">Importe de Reserva</Label>
            <div className="relative">
              <NumericInput
                id="payment_reserve"
                value={formData.payment_reserve || 0}
                onChange={(displayValue, numericValue) => handleNumericInputChange('payment_reserve', displayValue)}
                className={`pr-8 ${isFieldEmpty('payment_reserve') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                allowDecimals={true}
                min={0}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
            </div>
          </div>
        )}

        {(contractType === 'encargo' || contractType === 'compraventa_final') && (
          <div>
            <Label htmlFor="total_price">Precio Total (del Presupuesto Primario)</Label>
            <div className="relative">
              <Input
                id="total_price"
                type="number"
                step="0.01"
                value={formatInputValue(formData.total_price)}
                onChange={(e) => handleNumericInputChange('total_price', e.target.value)}
                readOnly={isFieldReadOnly('total_price')}
                className={`pr-8 ${isFieldReadOnly('total_price') ? "bg-muted" : ""}`}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
            </div>
          </div>
        )}

        {contractType === 'encargo' && (
          <>
            {/* Sistema de Pagos Simplificado para Encargo */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-800">Pagos</h5>

              {/* Reserva — read-only, desde contrato de reserva */}
              <div>
                <Label>Reserva (del contrato de reserva)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={reservationContract?.payment_reserve || 0}
                    readOnly
                    className="bg-muted pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
                {!reservationContract?.payment_reserve && (
                  <p className="text-xs text-amber-600 mt-1">No se encontró contrato de reserva.</p>
                )}
              </div>

              {/* Pago de Encargo — editable (se guarda en payment_first_amount) */}
              <div>
                <Label htmlFor="payment_first_amount">Pago de Encargo</Label>
                <div className="relative">
                  <NumericInput
                    id="payment_first_amount"
                    value={formData.payment_first_amount || 0}
                    onChange={(displayValue, numericValue) => handleNumericInputChange('payment_first_amount', displayValue)}
                    className={`pr-8 ${isFieldEmpty('payment_first_amount') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                    allowDecimals={true}
                    min={0}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
              </div>
            </div>
          </>
        )}

        {contractType === 'compraventa_final' && (
          <>
            {/* Desglose del Contrato Final */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-800">Desglose de Pagos</h5>

              {/* Reserva — read-only, auto-fetched */}
              <div>
                <Label>Reserva (del contrato de reserva)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={reservationContract?.payment_reserve || 0}
                    readOnly
                    className="bg-muted pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
                {!reservationContract?.payment_reserve && (
                  <p className="text-xs text-amber-600 mt-1">No se encontró contrato de reserva.</p>
                )}
              </div>

              {/* Pago de Encargo — read-only, auto-fetched */}
              <div>
                <Label>Pago de Encargo (del contrato de encargo)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={encargoContract?.payment_first_amount || 0}
                    readOnly
                    className="bg-muted pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
                {!encargoContract?.payment_first_amount && (
                  <p className="text-xs text-amber-600 mt-1">No se encontró contrato de encargo.</p>
                )}
              </div>

              {/* Último Pago — manual, editable */}
              <div>
                <Label htmlFor="payment_last_manual">Último Pago (real)</Label>
                <div className="relative">
                  <NumericInput
                    id="payment_last_manual"
                    value={formData.payment_last_manual || 0}
                    onChange={(displayValue, numericValue) => handleNumericInputChange('payment_last_manual', displayValue)}
                    className={`pr-8 ${isFieldEmpty('payment_last_manual') ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200' : ''}`}
                    allowDecimals={true}
                    min={0}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
              </div>

              {/* Desglose automático — read-only summary */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resumen de Pagos</p>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Precio total:</span>
                  <span className="text-right font-medium">{(formData.total_price || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>

                  <span className="text-muted-foreground">Reserva:</span>
                  <span className="text-right">-{(reservationContract?.payment_reserve || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>

                  <span className="text-muted-foreground">Pago de encargo:</span>
                  <span className="text-right">-{(encargoContract?.payment_first_amount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>

                  <span className="text-muted-foreground">Último pago:</span>
                  <span className="text-right">-{(formData.payment_last_manual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>

                  <span className="border-t border-border pt-1 text-muted-foreground font-semibold">Pendiente:</span>
                  <span className={`border-t border-border pt-1 text-right font-bold ${
                    ((formData.total_price || 0) - (reservationContract?.payment_reserve || 0) - (encargoContract?.payment_first_amount || 0) - (formData.payment_last_manual || 0)) === 0
                      ? 'text-green-600'
                      : ((formData.total_price || 0) - (reservationContract?.payment_reserve || 0) - (encargoContract?.payment_first_amount || 0) - (formData.payment_last_manual || 0)) < 0
                        ? 'text-red-600'
                        : 'text-amber-600'
                  }`}>
                    {((formData.total_price || 0) - (reservationContract?.payment_reserve || 0) - (encargoContract?.payment_first_amount || 0) - (formData.payment_last_manual || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>


    </div>
  );
};

export default ContractForm;
