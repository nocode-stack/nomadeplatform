import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOptimizedContractQuery } from '../../hooks/useOptimizedContractQuery';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileText, Calendar, User, Send, Loader2, Plus, Edit, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useContractVersioning } from '../../hooks/useContractVersioning';
import NewProjectForm from '../projects/NewProjectForm';
import ContractForm from './ContractForm';
import ContractSendConfirmationDialog from './ContractSendConfirmationDialog';

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
  };
}

interface ContractManagerProps {
  project: Project;
}

const ContractManager: React.FC<ContractManagerProps> = ({ project }) => {
  if (import.meta.env.DEV) console.log('🏗️ ContractManager renderizado con project:', project?.id);
  const [activeContract, setActiveContract] = useState('reserva');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editModes, setEditModes] = useState<{ [key: string]: boolean }>({});
  const [contractData, setContractData] = useState<{ [key: string]: any }>({});
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingContractType, setPendingContractType] = useState<string>('');
  const [pendingMissingFields, setPendingMissingFields] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { generateContract, setEditMode, sendContract } = useContractVersioning(project.id);

  // Query optimizada para obtener el estado de todos los contratos activos
  const { data: contractStatuses } = useOptimizedContractQuery(project.id);

  // Función para obtener el status de un contrato específico
  const getContractStatus = (contractType: string) => {
    const contract = contractStatuses?.find(c => c.contract_type === contractType);
    // Si no existe contrato, empezar en modo edición en lugar de "por_crear"
    const estadoVisual = contract?.estado_visual || 'editing';
    if (import.meta.env.DEV) console.log('getContractStatus - contractType:', contractType, 'estado_visual:', estadoVisual);

    // Retornar directamente el estado visual de la BD
    return estadoVisual;
  };

  // Función para obtener la versión de un contrato específico
  const getContractVersion = (contractType: string) => {
    const contract = contractStatuses?.find(c => c.contract_type === contractType);
    return contract?.version || 1;
  };

  // Función para obtener el color del badge según el status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-amber-500 text-white';
      case 'editing': return 'bg-orange-500 text-white';
      case 'sent': return 'bg-blue-500 text-white';
      case 'signed': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Función para obtener el texto del status
  const getStatusText = (status: string, contractType: string) => {
    switch (status) {
      case 'generated': return 'Generado';
      case 'editing': return 'En edición';
      case 'sent': return 'Enviado';
      case 'signed': return 'Firmado';
      case 'cancelled': return 'Cancelado';
      case 'por_crear': return 'En edición'; // Cambiar texto para que sea más claro
      default: return 'En edición'; // Por defecto en edición
    }
  };

  // Función para obtener las acciones disponibles según el estado
  const getAvailableActions = (status: string, contractType: string) => {
    const actions = {
      showEdit: true,
      showSend: true,
      editText: 'Generar Contrato',
      editVariant: 'default' as 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link',
      editIcon: Plus,
      sendText: 'Enviar',
      sendVariant: 'outline' as 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link',
      sendIcon: Send,
      sendDisabled: true
    };

    switch (status) {
      case 'por_crear':
      case 'draft':
      case 'editing':
        // Estado inicial o edición: Los campos están editables, generar cuando esté listo
        actions.editText = 'Generar Contrato';
        actions.editVariant = 'default';
        actions.editIcon = Plus;
        actions.sendText = 'Enviar';
        actions.sendVariant = 'outline';
        actions.sendDisabled = true;
        break;
      case 'generated':
        // Contrato generado: Editar disponible, enviar habilitado
        actions.editText = 'Editar';
        actions.editVariant = 'outline';
        actions.editIcon = Edit;
        actions.sendText = 'Enviar';
        actions.sendVariant = 'default';
        actions.sendDisabled = false;
        break;
      case 'sent':
        // Enviado: Puede crear nueva versión
        actions.editText = 'Nueva Versión';
        actions.editVariant = 'default';
        actions.editIcon = Plus;
        actions.sendText = 'Enviado';
        actions.sendVariant = 'outline';
        actions.sendDisabled = true;
        break;
    }

    return actions;
  };

  // Función para manejar el modo edición
  const handleEditModeChange = (contractType: string, editMode: boolean) => {
    setEditModes(prev => ({
      ...prev,
      [contractType]: editMode
    }));
  };

  // Función para activar modo edición o generar contrato
  const handleEditClick = async (contractType: string) => {
    if (import.meta.env.DEV) console.log('🎯 handleEditClick iniciado - contractType:', contractType);
    const status = getContractStatus(contractType);
    if (import.meta.env.DEV) console.log('🎯 handleEditClick - contractType:', contractType, 'status:', status);

    if (status === 'por_crear' || status === 'draft' || status === 'editing') {
      // Generar contrato (los campos ya están editables)
      await handleGenerateContract(contractType);
    } else if (status === 'generated' || status === 'sent') {
      // Cambiar estado visual a "editing" y activar modo edición local
      try {
        await setEditMode.mutateAsync(contractType);
        handleEditModeChange(contractType, true);
      } catch (error) {
        console.error('Error setting edit mode:', error);
        toast({
          title: "Error",
          description: "No se pudo activar el modo edición.",
          variant: "destructive"
        });
      }
    }
  };

  // Función para validar campos requeridos
  const validateRequiredFields = (contractType: string) => {
    const data = contractData[contractType];
    const missing: string[] = [];

    if (import.meta.env.DEV) console.log('validateRequiredFields - contractType:', contractType);
    if (import.meta.env.DEV) console.log('contractData available:', !!data);

    // Si no hay datos en contractData, obtener desde el proyecto (estado inicial)
    if (!data) {
      if (import.meta.env.DEV) console.log('No contractData found, checking project data');
      // En estado inicial, validar con datos del proyecto - más permisivo
      const projectData = {
        client_full_name: project.new_clients?.name || '',
        client_email: project.new_clients?.email || '',
        billing_address: project.new_clients?.address || '',
        vehicle_model: 'Modelo pendiente de especificar', // Valor por defecto
        payment_reserve: contractType === 'reservation' ? 1000 : 0, // Valor por defecto
        total_price: contractType !== 'reservation' ? 10000 : 0 // Valor por defecto
      };

      // Validar solo campos críticos
      if (!projectData.client_full_name?.trim()) missing.push('client_full_name');
      if (!projectData.client_email?.trim()) missing.push('client_email');

      return missing; // Permitir generar con datos básicos
    }

    // Campos básicos requeridos
    if (!data.client_full_name?.trim()) missing.push('client_full_name');
    if (!data.client_email?.trim()) missing.push('client_email');
    if (!data.client_phone?.trim()) missing.push('client_phone');
    if (!data.client_dni?.trim()) missing.push('client_dni');
    if (!data.billing_address?.trim()) missing.push('billing_address');
    if (!data.vehicle_model?.trim()) missing.push('vehicle_model');
    if (!data.vehicle_vin?.trim()) missing.push('vehicle_vin');
    if (!data.vehicle_plate?.trim()) missing.push('vehicle_plate');
    if (!data.vehicle_engine?.trim()) missing.push('vehicle_engine');

    // Campos específicos por tipo de contrato
    if (contractType === 'reservation') {
      if (!data.payment_reserve || data.payment_reserve <= 0) {
        missing.push('payment_reserve');
      }
      if (!data.iban?.trim()) missing.push('iban');
    }

    // El email es siempre crítico para DocuSign/Signaturit
    if (!data.client_email?.trim()) {
      if (!missing.includes('client_email')) missing.push('client_email');
    }

    return missing;
  };

  // Función para manejar la generación de contratos
  const handleGenerateContract = async (contractType: string) => {
    if (import.meta.env.DEV) console.log('🚀 handleGenerateContract iniciado - contractType:', contractType);

    // Obtener los datos del contrato desde el formulario si existen
    let data = contractData[contractType];

    if (!data) {
      // Intentar obtener el ID del cliente de varias fuentes
      const resolvedClientId = project.new_clients?.id || project.client_id || '';

      // Si no hay datos en el estado, crear datos básicos desde el proyecto con valores por defecto
      data = {
        project_id: project.id,
        client_id: resolvedClientId,
        contract_type: contractType,
        contract_status: 'generado',
        client_full_name: project.new_clients?.name || project.client_name || '',
        client_dni: project.new_clients?.dni || '',
        client_email: project.new_clients?.email || '',
        client_phone: project.new_clients?.phone || '',
        billing_entity_name: '',
        billing_entity_nif: '',
        billing_address: project.new_clients?.address || '',
        vehicle_model: 'Modelo pendiente de especificar',
        vehicle_vin: project.new_vehicles?.numero_bastidor || '',
        vehicle_plate: project.new_vehicles?.matricula || '',
        total_price: contractType === 'reservation' ? 0 : 25000,
        payment_reserve: contractType === 'reservation' ? 2000 : 0,
        payment_conditions: 'Condiciones estándar de pago',
        iban: 'ES80 0081 7011 1900 0384 8192',
        vehicle_engine: '',
        delivery_months: 6,
        payment_first_percentage: 30,
        payment_first_amount: contractType !== 'reservation' ? 7500 : 0,
        payment_second_percentage: 70,
        payment_second_amount: contractType !== 'reservation' ? 17500 : 0,
        payment_third_percentage: 0,
        payment_third_amount: 0
      };
    }

    // VALIDACIÓN CRÍTICA: Bloquear si no hay datos esenciales
    const criticalMissing = [];
    if (!data.client_full_name?.trim()) criticalMissing.push('Nombre del cliente');
    if (!data.client_email?.trim()) criticalMissing.push('Email del cliente');

    // Validar formato UUID de client_id para evitar errores de BD
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.client_id || '');
    if (!isValidUUID) {
      console.warn('⚠️ client_id no es un UUID válido:', data.client_id);
      criticalMissing.push('Identificador de cliente válido');
    }

    if (criticalMissing.length > 0) {
      toast({
        title: "Datos incompletos",
        description: `No se puede generar el contrato sin: ${criticalMissing.join(', ')}. Por favor, inténtalo de nuevo o completa los datos en la pestaña Información.`,
        variant: "destructive"
      });
      return;
    }

    // Asegurar que el estado sea 'generado'
    data.contract_status = 'generado';

    if (import.meta.env.DEV) console.log('About to call generateContract.mutateAsync with:', { contractData: data, contractType });

    try {
      await generateContract.mutateAsync({
        contractData: data,
        contractType
      });

      if (import.meta.env.DEV) console.log('generateContract.mutateAsync completed successfully');

      toast({
        title: "Contrato generado",
        description: "El contrato se ha generado correctamente.",
      });
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Error",
        description: "Error al generar el contrato. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Función para manejar cambios en los datos del formulario
  const handleFormDataChange = (contractType: string) => (formData: any) => {
    if (import.meta.env.DEV) console.log('handleFormDataChange - contractType:', contractType, 'formData:', formData);
    setContractData(prev => ({
      ...prev,
      [contractType]: formData
    }));
  };

  // Estados de loading locales para evitar flickering
  const [sendingStates, setSendingStates] = useState<{ [key: string]: boolean }>({});

  // Función para mostrar el diálogo de confirmación de envío
  const handleSendContractClick = (contractType: string) => {
    // Verificar que el contrato esté en estado 'generado'
    const status = getContractStatus(contractType);
    if (status !== 'generated') {
      toast({
        title: "No se puede enviar",
        description: "Solo se pueden enviar contratos generados.",
        variant: "destructive"
      });
      return;
    }

    // Validar campos requeridos
    const missingFields = validateRequiredFields(contractType);

    // Configurar el diálogo de confirmación
    setPendingContractType(contractType);
    setPendingMissingFields(missingFields);
    setShowConfirmationDialog(true);
  };

  // Función para enviar contrato usando el hook unificado
  const handleSendContract = async (contractType: string) => {
    setShowConfirmationDialog(false);

    // Activar estado de loading local
    setSendingStates(prev => ({ ...prev, [contractType]: true }));

    try {
      await sendContract.mutateAsync(contractType);
      // No mostrar toast aquí, el hook ya lo maneja
    } catch (error) {
      console.error('Error sending contract:', error);
      toast({
        title: "Error",
        description: "Error al enviar el contrato. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      // Desactivar estado de loading local después de un delay
      setTimeout(() => {
        setSendingStates(prev => ({ ...prev, [contractType]: false }));
      }, 500);
    }
  };

  // Función para guardar cambios en modo edición
  const handleSaveChanges = async (contractType: string) => {
    try {
      // Usar los datos existentes del contractData o datos del proyecto
      let data = contractData[contractType];

      if (!data) {
        // Si no hay datos en el estado, crear datos básicos desde el proyecto
        data = {
          project_id: project.id,
          client_id: project.new_clients?.id || '',
          contract_type: contractType,
          contract_status: 'generated',
          client_full_name: project.new_clients?.name || '',
          client_dni: project.new_clients?.dni || '',
          client_email: project.new_clients?.email || '',
          client_phone: project.new_clients?.phone || '',
          billing_entity_name: '',
          billing_entity_nif: '',
          billing_address: project.new_clients?.address || '',
          vehicle_model: '',
          vehicle_vin: project.new_vehicles?.numero_bastidor || '',
          vehicle_plate: project.new_vehicles?.matricula || '',
          total_price: 0,
          payment_reserve: 0,
          payment_conditions: '',
          iban: 'ES80 0081 7011 1900 0384 8192',
          vehicle_engine: '',
          delivery_months: 0,
          payment_first_percentage: 0,
          payment_first_amount: 0,
          payment_second_percentage: 0,
          payment_second_amount: 0,
          payment_third_percentage: 0,
          payment_third_amount: 0
        };
      } else {
        // Asegurar que el estado sea 'generated'
        data.contract_status = 'generated';
      }

      await generateContract.mutateAsync({
        contractData: data,
        contractType
      });

      // Salir del modo edición
      handleEditModeChange(contractType, false);

      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Error al guardar los cambios. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  // El ContractForm maneja la generación directamente

  const contractTypes = [
    {
      id: 'reserva',
      label: 'Contrato de Reserva',
      description: 'Documento de reserva del vehículo con pago inicial',
      icon: Calendar,
      contractType: 'reservation'
    },
    {
      id: 'acuerdo',
      label: 'Acuerdo de Compraventa',
      description: 'Acuerdo previo a la compraventa definitiva',
      icon: FileText,
      contractType: 'purchase_agreement'
    },
    {
      id: 'compraventa',
      label: 'Contrato de Compraventa',
      description: 'Contrato definitivo de compraventa del vehículo',
      icon: User,
      contractType: 'sale_contract'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Contratos</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona los contratos del proyecto {project.code}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Para editar la información del proyecto, ve a la pestaña "Información"
          </p>
        </div>
      </div>

      <Tabs value={activeContract} onValueChange={setActiveContract} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-16">
          {contractTypes.map((type) => {
            const status = getContractStatus(type.contractType);
            return (
              <TabsTrigger key={type.id} value={type.id} className="text-xs sm:text-sm h-full p-2">
                <div className="flex flex-col items-center justify-center space-y-1 h-full">
                  <span className="text-center leading-tight">{type.label}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs px-2 py-0.5 ${getStatusColor(status)}`}
                  >
                    {getStatusText(status, type.contractType)}
                  </Badge>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {contractTypes.map((type) => {
          const status = getContractStatus(type.contractType);
          const actions = getAvailableActions(status, type.contractType);
          const isEditMode = editModes[type.contractType] || false;

          return (
            <TabsContent key={type.id} value={type.id} className="mt-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <type.icon className="h-5 w-5 text-blue-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs w-fit ${getStatusColor(status)}`}
                          >
                            {getStatusText(status, type.contractType)}
                          </Badge>
                          {getContractVersion(type.contractType) > 1 && (
                            <Badge variant="outline" className="text-xs">
                              v{getContractVersion(type.contractType)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Botón 1: Generar/Editar Contrato */}
                      <Button
                        onClick={() => {
                          if (import.meta.env.DEV) console.log('🔥 CLICK EN BOTÓN DETECTADO - contractType:', type.contractType);
                          handleEditClick(type.contractType);
                        }}
                        size="sm"
                        variant={actions.editVariant}
                        className="flex items-center space-x-2"
                      >
                        <actions.editIcon className="h-4 w-4" />
                        <span>{actions.editText}</span>
                      </Button>

                      {/* Botón 2: Enviar */}
                      <Button
                        onClick={() => handleSendContractClick(type.contractType)}
                        disabled={actions.sendDisabled || sendingStates[type.contractType] || sendContract.isPending}
                        size="sm"
                        variant={actions.sendVariant}
                        className="flex items-center space-x-2"
                      >
                        {(sendingStates[type.contractType] || sendContract.isPending) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <actions.sendIcon className="h-4 w-4" />
                        )}
                        <span>{(sendingStates[type.contractType] || sendContract.isPending) ? 'Enviando...' : actions.sendText}</span>
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <ContractForm
                    project={project}
                    contractType={type.contractType}
                    status={status}
                    isEditMode={isEditMode}
                    onEditModeChange={(editMode) => handleEditModeChange(type.contractType, editMode)}
                    onFormDataChange={handleFormDataChange(type.contractType)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Diálogo de confirmación de envío */}
      <ContractSendConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        onConfirm={() => handleSendContract(pendingContractType)}
        contractType={pendingContractType}
        missingFields={pendingMissingFields}
        isLoading={sendingStates[pendingContractType] || sendContract.isPending}
      />
    </div>
  );
};

export default ContractManager;