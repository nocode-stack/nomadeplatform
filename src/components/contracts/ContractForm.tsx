import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { NumericInput } from '../ui/numeric-input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { useContractVersioning } from '../../hooks/useContractVersioning';
import { useVehicleSpecsComparison } from '../../hooks/useVehicleSpecsComparison';
import { VehicleSpecsAlert } from './VehicleSpecsAlert';
import { Loader2, AlertTriangle, CheckCircle, Clock, Save, Plus } from 'lucide-react';

interface Project {
  id: string;
  code?: string;
  name?: string;
  new_clients?: {
    id?: string;
    name?: string;
    email?: string;
    dni?: string;
    phone?: string;
    address?: string;
  };
  new_vehicles?: {
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
  onFormDataChange?: (formData: any) => void;
}

interface ContractData {
  id?: string;
  project_id: string;
  client_id: string;
  contract_type: string;
  contract_status: string;
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
}

const ContractForm: React.FC<ContractFormProps> = ({ 
  project, 
  contractType,
  status,
  isEditMode = false,
  onEditModeChange,
  onFormDataChange
}) => {
  const { toast } = useToast();
  const { autoSave } = useContractVersioning(project.id);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ContractData>({
    project_id: project.id,
    client_id: project.new_clients?.id || '',
    contract_type: contractType,
    contract_status: 'draft',
    client_full_name: '',
    client_dni: '',
    client_email: '',
    client_phone: '',
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
        .from('NEW_Budget')
        .select(`
          total,
          model_option_id,
          model_options(name),
          engine_option:engine_options(name, power, transmission),
          exterior_color:exterior_color_options(name)
        `)
        .eq('project_id', project.id)
        .eq('is_primary', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching primary budget:', error);
        return null;
      }

      if (import.meta.env.DEV) console.log('Primary budget data:', data);
      return data;
    },
    enabled: !!project.id
  });

  // Cargar datos del vehículo asociado al proyecto
  const { data: vehicleData } = useQuery({
    queryKey: ['projectVehicle', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Vehicles')
        .select('*')
        .eq('project_id', project.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vehicle data:', error);
        return null;
      }

      return data;
    },
    enabled: !!project.id
  });

  // Cargar contrato de reserva si es purchase_agreement
  const { data: reservationContract } = useQuery({
    queryKey: ['reservationContract', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Contracts')
        .select('payment_reserve')
        .eq('project_id', project.id)
        .eq('contract_type', 'reservation')
        .eq('is_latest', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching reservation contract:', error);
        return null;
      }

      return data;
    },
    enabled: contractType === 'purchase_agreement'
  });

  // Cargar contrato activo existente - ÚNICA FUENTE DE VERDAD
  const { data: existingContract, isLoading } = useQuery({
    queryKey: ['contract', project.id, contractType],
    queryFn: async () => {
      const { data: contractData, error: contractError } = await supabase
        .from('NEW_Contracts')
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

  // Query separada para obtener datos del cliente y facturación
  const { data: clientBillingData } = useQuery({
    queryKey: ['clientBilling', project.new_clients?.id],
    queryFn: async () => {
      if (!project.new_clients?.id) return null;

      const [clientResult, billingResult] = await Promise.all([
        supabase
          .from('NEW_Clients')
          .select('*')
          .eq('id', project.new_clients.id)
          .single(),
        supabase
          .from('NEW_Billing')
          .select('*')
          .eq('client_id', project.new_clients.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      return {
        client: clientResult.data,
        billing: billingResult.data
      };
    },
    enabled: !!project.new_clients?.id
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
          table: 'NEW_Contracts',
          filter: `project_id=eq.${project.id}`
        },
        (payload) => {
          if (import.meta.env.DEV) console.log('Contract updated:', payload);
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
          table: 'NEW_Clients'
        },
        () => {
          if (import.meta.env.DEV) console.log('Client data updated, refreshing contract form');
          queryClient.invalidateQueries({ 
            queryKey: ['clientBilling', project.new_clients?.id] 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'NEW_Billing'
        },
        () => {
          if (import.meta.env.DEV) console.log('Billing data updated, refreshing contract form');
          queryClient.invalidateQueries({ 
            queryKey: ['clientBilling', project.new_clients?.id] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, contractType, queryClient, project.new_clients?.id]);

  // Inicializar formulario con datos del contrato existente o datos base
  useEffect(() => {
    if (existingContract && !formData.id) {
      // Cargar contrato existente
      setFormData({
        ...existingContract,
        payment_reserve: existingContract.payment_reserve || 0,
        vehicle_engine: existingContract.vehicle_engine || '',
        delivery_months: existingContract.delivery_months || 0,
        payment_first_percentage: existingContract.payment_first_percentage || 0,
        payment_first_amount: existingContract.payment_first_amount || 0,
        payment_second_percentage: existingContract.payment_second_percentage || 0,
        payment_second_amount: existingContract.payment_second_amount || 0,
        payment_third_percentage: existingContract.payment_third_percentage || 0,
        payment_third_amount: existingContract.payment_third_amount || 0
      });
    } else if (!existingContract && clientBillingData && !formData.id) {
      // Inicializar con datos del cliente y facturación si no hay contrato
      const { client, billing } = clientBillingData;
      setFormData(prev => ({
        ...prev,
        project_id: project.id,
        client_id: client?.id || '',
        contract_type: contractType,
        client_full_name: client?.name || '',
        client_dni: client?.dni || '',
        client_email: client?.email || '',
        client_phone: client?.phone || '',
        billing_entity_name: billing?.name !== client?.name ? (billing?.name || '') : '',
        billing_entity_nif: billing?.nif || '',
        billing_address: billing?.billing_address || client?.address || '',
        iban: 'ES80 0081 7011 1900 0384 8192'
      }));
    }
  }, [existingContract, clientBillingData, project.id, contractType, formData.id]);

  // Actualizar datos del cliente y facturación cuando cambien
  useEffect(() => {
    if (existingContract && clientBillingData && formData.id) {
      const { client, billing } = clientBillingData;
      setFormData(prev => ({
        ...prev,
        // Actualizar solo campos de cliente y facturación con datos frescos
        client_full_name: client?.name || prev.client_full_name,
        client_dni: client?.dni || prev.client_dni,
        client_email: client?.email || prev.client_email,
        client_phone: client?.phone || prev.client_phone,
        billing_entity_name: billing?.name !== client?.name ? (billing?.name || prev.billing_entity_name) : prev.billing_entity_name,
        billing_entity_nif: billing?.nif || prev.billing_entity_nif,
        billing_address: billing?.billing_address || client?.address || prev.billing_address
      }));
    }
  }, [clientBillingData, existingContract, formData.id]);

  // Usar hook para comparar especificaciones
  const vehicleSpecsComparison = useVehicleSpecsComparison(vehicleData, {
    engine_option: primaryBudget?.engine_option,
    exterior_color: primaryBudget?.exterior_color,
    model_option: primaryBudget?.model_options
  });

  // Actualizar precio total desde presupuesto primario
  useEffect(() => {
    if (primaryBudget && primaryBudget.total && (contractType === 'purchase_agreement' || contractType === 'sale_contract')) {
      // Redondear a 2 decimales para evitar problemas de precisión
      const roundedTotal = Math.round(primaryBudget.total * 100) / 100;
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

  // Actualizar model desde presupuesto primario
  useEffect(() => {
    if (import.meta.env.DEV) console.log('Primary budget effect triggered:', primaryBudget);
    if (primaryBudget) {
      // Obtener el nombre del modelo desde la relación model_options
      const modelName = primaryBudget.model_options?.name || 'Modelo pendiente de especificar';
      if (import.meta.env.DEV) console.log('Model name from budget:', modelName);
      setFormData(prev => ({
        ...prev,
        vehicle_model: modelName
      }));
    }
  }, [primaryBudget]);

  // Usar el autoSave del hook unificado

  // Autoguardar optimizado - solo en modo edición con debounce inteligente
  useEffect(() => {
    if (existingContract?.id && formData && status === 'editing') {
      const timer = setTimeout(() => {
        if (!autoSave.isPending) {
          if (import.meta.env.DEV) console.log('🔄 Auto-guardando contrato:', formData);
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
    if (!formData.vehicle_model?.trim()) missing.push('vehicle_model');
    
    // Campos específicos por tipo de contrato
    if (contractType === 'reservation' && (!formData.payment_reserve || formData.payment_reserve <= 0)) {
      missing.push('payment_reserve');
    }
    
    if ((contractType === 'purchase_agreement' || contractType === 'sale_contract') && (!formData.total_price || formData.total_price <= 0)) {
      missing.push('total_price');
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
    // Definir TODOS los campos posibles según el tipo de contrato
    let allFields: (keyof ContractData)[] = [
      // Información del Cliente
      'client_full_name',
      'client_dni', 
      'client_email',
      'client_phone',
      // Información de Facturación
      'billing_entity_name',
      'billing_entity_nif',
      'billing_address',
      // Información del Vehículo
      'vehicle_model',
      'vehicle_engine',
      'vehicle_vin',
      'vehicle_plate'
    ];

    // Agregar campos específicos según el tipo de contrato
    if (contractType === 'reservation') {
      allFields.push('payment_reserve');
    } else if (contractType === 'purchase_agreement') {
      allFields.push(
        'total_price',
        'delivery_months',
        'payment_first_percentage',
        'payment_first_amount',
        'payment_second_percentage', 
        'payment_second_amount',
        'payment_third_percentage',
        'payment_third_amount'
      );
    } else if (contractType === 'sale_contract') {
      allFields.push('total_price');
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
  const isFieldReadOnly = (fieldName: string) => {
    // Si el contrato está generado o enviado y no estamos en modo edición, bloquear todos los campos
    if ((status === 'generated' || status === 'sent') && !isEditMode) {
      return true;
    }
    
    // Definir campos editables por tipo de contrato cuando está en modo edición
    const editableFields: Record<string, string[]> = {
      'reservation': ['iban', 'payment_reserve'],
      'purchase_agreement': ['delivery_months', 'payment_first_percentage', 'payment_first_amount', 'payment_second_percentage', 'payment_second_amount'],
      'sale_contract': [] // Ningún campo editable en contrato de venta
    };
    
    // Obtener campos editables para el tipo de contrato actual
    const currentEditableFields = editableFields[contractType] || [];
    
    // Solo permitir edición de campos específicos según el tipo de contrato
    // Todos los demás campos están bloqueados permanentemente
    return !currentEditableFields.includes(fieldName);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando datos del contrato...</span>
      </div>
    );
  }

  const progressPercentage = calculateProgress();

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
      </div>

      {/* Alert de discrepancias de especificaciones - solo para acuerdo de compraventa */}
      {contractType === 'purchase_agreement' && vehicleSpecsComparison.hasDiscrepancies && (
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
        {/* Información del Cliente */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Información del Cliente</h4>
          
           <div>
             <Label htmlFor="client_full_name">Nombre Completo</Label>
             <Input
               id="client_full_name"
               value={formData.client_full_name || ''}
               onChange={(e) => handleInputChange('client_full_name', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>

           <div>
             <Label htmlFor="client_dni">DNI</Label>
             <Input
               id="client_dni"
               value={formData.client_dni || ''}
               onChange={(e) => handleInputChange('client_dni', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>

           <div>
             <Label htmlFor="client_email">Email</Label>
             <Input
               id="client_email"
               type="email"
               value={formData.client_email || ''}
               onChange={(e) => handleInputChange('client_email', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>

           <div>
             <Label htmlFor="client_phone">Teléfono</Label>
             <Input
               id="client_phone"
               value={formData.client_phone || ''}
               onChange={(e) => handleInputChange('client_phone', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>
        </div>

        {/* Información de Facturación */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Información de Facturación</h4>
          
           <div>
             <Label htmlFor="billing_entity_name">Entidad de Facturación</Label>
             <Input
               id="billing_entity_name"
               value={formData.billing_entity_name || ''}
               onChange={(e) => handleInputChange('billing_entity_name', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>

           <div>
             <Label htmlFor="billing_entity_nif">NIF Entidad</Label>
             <Input
               id="billing_entity_nif"
               value={formData.billing_entity_nif || ''}
               onChange={(e) => handleInputChange('billing_entity_nif', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>

           <div>
             <Label htmlFor="billing_address">Dirección de Facturación</Label>
             <Textarea
               id="billing_address"
               value={formData.billing_address || ''}
               onChange={(e) => handleInputChange('billing_address', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>

           <div>
             <Label htmlFor="iban">IBAN</Label>
             <Input
               id="iban"
               value={formData.iban || 'ES80 0081 7011 1900 0384 8192'}
               onChange={(e) => handleInputChange('iban', e.target.value)}
               readOnly={isFieldReadOnly('iban')}
               className={isFieldReadOnly('iban') ? "bg-muted" : ""}
             />
           </div>
         </div>

         {/* Información del Vehículo */}
         <div className="space-y-4">
           <h4 className="font-semibold text-gray-900">Información del Vehículo</h4>
           
           {/* Mostrar alerta de discrepancias si las hay */}
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
               value={formData.vehicle_model || 'Modelo pendiente de especificar'}
               onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
               readOnly={true}
               className="bg-muted"
             />
           </div>

             <div>
               <Label htmlFor="vehicle_engine">Motorización</Label>
               <Input
                 id="vehicle_engine"
                 value={formData.vehicle_engine || ''}
                 onChange={(e) => handleInputChange('vehicle_engine', e.target.value)}
                 readOnly={true}
                 className="bg-muted"
               />
             </div>

           <div>
             <Label htmlFor="vehicle_vin">Número de Bastidor</Label>
             <Input
               id="vehicle_vin"
               value={formData.vehicle_vin || ''}
               readOnly
               className="bg-muted"
             />
           </div>

           <div>
             <Label htmlFor="vehicle_plate">Matrícula</Label>
             <Input
               id="vehicle_plate"
               value={formData.vehicle_plate || ''}
               readOnly
               className="bg-muted"
             />
           </div>
        </div>

        {/* Información Específica del Contrato */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Información del Contrato</h4>
          
           {contractType === 'reservation' && (
              <div>
                <Label htmlFor="payment_reserve">Importe de Reserva</Label>
                <div className="relative">
                  <NumericInput
                    id="payment_reserve"
                    value={formData.payment_reserve || 0}
                     onChange={(displayValue, numericValue) => handleNumericInputChange('payment_reserve', displayValue)}
                     readOnly={isFieldReadOnly('payment_reserve')}
                     className={`pr-8 ${isFieldReadOnly('payment_reserve') ? "bg-muted" : ""}`}
                    allowDecimals={true}
                    min={0}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
              </div>
           )}

            {(contractType === 'purchase_agreement' || contractType === 'sale_contract') && (
              <div>
                <Label htmlFor="total_price">Precio Total (del Presupuesto Primario)</Label>
                <div className="relative">
                  <Input
                    id="total_price"
                    type="number"
                    step="0.01"
                    value={formatInputValue(formData.total_price)}
                    onChange={(e) => handleNumericInputChange('total_price', e.target.value)}
                    readOnly={true}
                    className="pr-8 bg-muted"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
              </div>
            )}

          {contractType === 'purchase_agreement' && (
            <>
               <div>
                 <Label htmlFor="delivery_months">Entrega del Vehículo (meses)</Label>
                   <NumericInput
                     id="delivery_months"
                     value={formData.delivery_months || 0}
                     onChange={(displayValue, numericValue) => handleNumericInputChange('delivery_months', displayValue)}
                     readOnly={isFieldReadOnly('delivery_months')}
                     className={isFieldReadOnly('delivery_months') ? "bg-muted" : ""}
                     allowDecimals={false}
                     min={0}
                   />
               </div>

              {/* Sistema de Pagos */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-800">Sistema de Pagos</h5>
                
                 {/* Reserva */}
                 <div>
                   <Label>Reserva</Label>
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
                 </div>

                  {/* Primer Pago */}
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <Label htmlFor="payment_first_percentage">Primer Pago</Label>
                     <div className="relative">
                        <NumericInput
                          id="payment_first_percentage"
                          value={formData.payment_first_percentage || 0}
                           onChange={(displayValue, numericValue) => handlePaymentChange('first', 'percentage', displayValue)}
                           readOnly={isFieldReadOnly('payment_first_percentage')}
                           className={`pr-8 ${isFieldReadOnly('payment_first_percentage') ? "bg-muted" : ""}`}
                          allowDecimals={true}
                          min={0}
                          max={100}
                        />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">%</span>
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="payment_first_amount">Primer Pago</Label>
                     <div className="relative">
                        <NumericInput
                          id="payment_first_amount"
                          value={formData.payment_first_amount || 0}
                           onChange={(displayValue, numericValue) => handlePaymentChange('first', 'amount', displayValue)}
                           readOnly={isFieldReadOnly('payment_first_amount')}
                           className={`pr-8 ${isFieldReadOnly('payment_first_amount') ? "bg-muted" : ""}`}
                          allowDecimals={true}
                          min={0}
                        />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                     </div>
                   </div>
                 </div>

                 {/* Segundo Pago */}
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <Label htmlFor="payment_second_percentage">Segundo Pago</Label>
                     <div className="relative">
                        <NumericInput
                          id="payment_second_percentage"
                          value={formData.payment_second_percentage || 0}
                           onChange={(displayValue, numericValue) => handlePaymentChange('second', 'percentage', displayValue)}
                           readOnly={isFieldReadOnly('payment_second_percentage')}
                           className={`pr-8 ${isFieldReadOnly('payment_second_percentage') ? "bg-muted" : ""}`}
                          allowDecimals={true}
                          min={0}
                          max={100}
                        />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">%</span>
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="payment_second_amount">Segundo Pago</Label>
                     <div className="relative">
                        <NumericInput
                          id="payment_second_amount"
                          value={formData.payment_second_amount || 0}
                           onChange={(displayValue, numericValue) => handlePaymentChange('second', 'amount', displayValue)}
                           readOnly={isFieldReadOnly('payment_second_amount')}
                           className={`pr-8 ${isFieldReadOnly('payment_second_amount') ? "bg-muted" : ""}`}
                          allowDecimals={true}
                          min={0}
                        />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                     </div>
                   </div>
                 </div>

                 {/* Tercer Pago - Calculado automáticamente */}
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <Label htmlFor="payment_third_percentage">Tercer Pago - Automático</Label>
                     <div className="relative">
                       <Input
                         id="payment_third_percentage"
                         type="number"
                         step="0.01"
                         value={thirdPayment.percentage.toFixed(2)}
                         readOnly
                         className="bg-muted pr-8"
                       />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">%</span>
                     </div>
                   </div>
                   <div>
                     <Label htmlFor="payment_third_amount">Tercer Pago - Automático</Label>
                     <div className="relative">
                       <Input
                         id="payment_third_amount"
                         type="number"
                         step="0.01"
                         value={thirdPayment.amount.toFixed(2)}
                         readOnly
                         className="bg-muted pr-8"
                       />
                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                     </div>
                   </div>
                 </div>
              </div>
            </>
          )}
         </div>
       </div>

     </div>
   );
 };

export default ContractForm;