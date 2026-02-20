import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, User, FileText, Settings, Edit } from 'lucide-react';
import BillingInfoForm from './BillingInfoForm';
import ProjectCodeSelector from './ProjectCodeSelector';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBillingData } from '../../hooks/useBillingData';
import { UnifiedProject } from '../../types/database';

const editProjectSchema = z.object({
  // Información del cliente (obligatorios)
  clientName: z.string().min(1, 'El nombre del cliente es obligatorio'),
  clientEmail: z.string().email('Email válido requerido'),
  clientPhone: z.string().min(1, 'El teléfono es obligatorio'),

  // Información del cliente (opcionales)
  clientDni: z.string().optional(),
  clientAddress: z.string().optional(),
  clientBirthDate: z.string().optional(),

  // Código de producción (opcional)
  productionCodeId: z.string().optional(),

  // Comercial asignado
  comercial: z.string().optional(),

  // Información de facturación - TODOS OPCIONALES POR DEFECTO
  billingType: z.enum(['personal', 'other_person', 'company']).default('personal'),

  // Facturación personal (datos del cliente)
  clientBillingName: z.string().optional(),
  clientBillingEmail: z.string().optional(),
  clientBillingPhone: z.string().optional(),
  clientBillingAddress: z.string().optional(),

  // Facturación otra persona física
  otherPersonName: z.string().optional(),
  otherPersonEmail: z.string().optional(),
  otherPersonPhone: z.string().optional(),
  otherPersonAddress: z.string().optional(),
  otherPersonDni: z.string().optional(),

  // Facturación empresarial
  clientBillingCompanyName: z.string().optional(),
  clientBillingCompanyCif: z.string().optional(),
  clientBillingCompanyPhone: z.string().optional(),
  clientBillingCompanyEmail: z.string().optional(),
  clientBillingCompanyAddress: z.string().optional(),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
  projectData: UnifiedProject;
  onProjectUpdated?: () => void;
}

const EditProjectForm = ({
  projectData,
  onProjectUpdated
}: EditProjectFormProps) => {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const queryClient = useQueryClient();

  // Cargar datos de billing desde el inicio
  const { data: billingData, isLoading: billingLoading } = useBillingData(
    projectData?.new_clients?.id
  );

  // Configurar defaultValues con datos reales cargados
  const getDefaultValues = (): EditProjectFormData => {
    const defaults: EditProjectFormData = {
      clientName: projectData?.new_clients?.name || '',
      clientEmail: projectData?.new_clients?.email || '',
      clientPhone: projectData?.new_clients?.phone || '',
      clientDni: projectData?.new_clients?.dni || '',
      clientAddress: projectData?.new_clients?.address || '',
      clientBirthDate: projectData?.new_clients?.birthdate || '',
      productionCodeId: projectData?.production_slot?.id || '',
      comercial: projectData?.comercial || '',
      billingType: 'personal',
      clientBillingName: '',
      clientBillingEmail: '',
      clientBillingPhone: '',
      clientBillingAddress: '',
      otherPersonName: '',
      otherPersonEmail: '',
      otherPersonPhone: '',
      otherPersonAddress: '',
      otherPersonDni: '',
      clientBillingCompanyName: '',
      clientBillingCompanyCif: '',
      clientBillingCompanyPhone: '',
      clientBillingCompanyEmail: '',
      clientBillingCompanyAddress: '',
    };

    // Si hay datos de billing, configurarlos
    if (billingData && !billingLoading) {
      const billingType = billingData.type === 'individual' ? 'personal' : 'company';
      defaults.billingType = billingType;

      if (billingType === 'personal') {
        defaults.clientBillingName = billingData.name || '';
        defaults.clientBillingEmail = billingData.email || '';
        defaults.clientBillingPhone = billingData.phone || '';
        defaults.clientBillingAddress = billingData.billing_address || '';
      } else {
        defaults.clientBillingCompanyName = billingData.name || '';
        defaults.clientBillingCompanyEmail = billingData.email || '';
        defaults.clientBillingCompanyPhone = billingData.phone || '';
        defaults.clientBillingCompanyAddress = billingData.billing_address || '';
        defaults.clientBillingCompanyCif = billingData.nif || '';
      }
    }

    return defaults;
  };

  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: getDefaultValues(),
  });

  // Actualizar el formulario cuando cambien los datos de billing
  React.useEffect(() => {
    if (billingData && !billingLoading) {
      const billingType = billingData.type === 'individual' ? 'personal' : 'company';

      form.reset({
        ...form.getValues(),
        billingType,
        ...(billingType === 'personal' ? {
          clientBillingName: billingData.name || '',
          clientBillingEmail: billingData.email || '',
          clientBillingPhone: billingData.phone || '',
          clientBillingAddress: billingData.billing_address || '',
        } : {
          clientBillingCompanyName: billingData.name || '',
          clientBillingCompanyEmail: billingData.email || '',
          clientBillingCompanyPhone: billingData.phone || '',
          clientBillingCompanyAddress: billingData.billing_address || '',
          clientBillingCompanyCif: billingData.nif || '',
        })
      });
    }
  }, [billingData, billingLoading, form]);

  const onSubmit = async (data: EditProjectFormData) => {
    setIsLoading(true);

    try {
      // Update client data
      if (projectData?.new_clients?.id) {
        const { error: clientError } = await supabase
          .from('NEW_Clients')
          .update({
            name: data.clientName,
            email: data.clientEmail,
            phone: data.clientPhone,
            dni: data.clientDni || null,
            address: data.clientAddress || null,
            birthdate: data.clientBirthDate || null,
          })
          .eq('id', projectData.new_clients.id);

        if (clientError) throw clientError;

        // Update billing data
        const billingUpdateData = {
          type: data.billingType === 'personal' ? 'individual' :
            data.billingType === 'other_person' ? 'individual' : 'company',
          name: data.billingType === 'personal' ? (data.clientBillingName || data.clientName) :
            data.billingType === 'other_person' ? data.otherPersonName :
              data.clientBillingCompanyName,
          email: data.billingType === 'personal' ? (data.clientBillingEmail || data.clientEmail) :
            data.billingType === 'other_person' ? data.otherPersonEmail :
              data.clientBillingCompanyEmail,
          phone: data.billingType === 'personal' ? (data.clientBillingPhone || data.clientPhone) :
            data.billingType === 'other_person' ? data.otherPersonPhone :
              data.clientBillingCompanyPhone,
          billing_address: data.billingType === 'personal' ? (data.clientBillingAddress || data.clientAddress) :
            data.billingType === 'other_person' ? data.otherPersonAddress :
              data.clientBillingCompanyAddress,
          nif: data.billingType === 'other_person' ? data.otherPersonDni :
            data.billingType === 'company' ? data.clientBillingCompanyCif : null,
          updated_at: new Date().toISOString(),
        };

        // Check if billing record exists
        const { data: existingBilling } = await supabase
          .from('NEW_Billing')
          .select('id')
          .eq('client_id', projectData.new_clients.id)
          .maybeSingle();

        if (existingBilling) {
          // Update existing billing record
          const { error: billingError } = await supabase
            .from('NEW_Billing')
            .update(billingUpdateData)
            .eq('id', existingBilling.id);

          if (billingError) throw billingError;
        } else {
          // Create new billing record
          const { error: billingError } = await supabase
            .from('NEW_Billing')
            .insert({
              client_id: projectData.new_clients.id,
              ...billingUpdateData,
            });

          if (billingError) throw billingError;
        }

        // Invalidar cache para sincronizar con otros componentes
        await queryClient.invalidateQueries({
          queryKey: ['billing-data', projectData.new_clients.id]
        });
      }

      // Update project data
      const { error: projectError } = await supabase
        .from('NEW_Projects')
        .update({
          slot_id: data.productionCodeId || null,
          comercial: data.comercial || null,
        })
        .eq('id', projectData.id);

      if (projectError) throw projectError;

      setOpen(false);

      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading si aún se están cargando los datos de billing
  if (billingLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Editar Proyecto</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-4" />
            <span className="text-lg">Cargando datos del proyecto...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Edit className="h-4 w-4" />
          <span>Editar Proyecto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
          <DialogDescription>
            Modifica la información del proyecto y del cliente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="proyecto" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="proyecto" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Proyecto
                </TabsTrigger>
                <TabsTrigger value="cliente" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="facturacion" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Facturación
                </TabsTrigger>
              </TabsList>

              {/* Información del Proyecto */}
              <TabsContent value="proyecto" className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Proyecto</h3>

                {/* Status del Cliente */}
                <div className={`p-3 rounded-md border ${projectData?.new_clients?.client_status === 'prospect'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Estado del Cliente</label>
                      <p className={`text-lg font-semibold mt-1 ${projectData?.new_clients?.client_status === 'prospect'
                        ? 'text-yellow-700'
                        : 'text-green-700'
                        }`}>
                        {projectData?.new_clients?.client_status === 'prospect' ? 'Prospecto' : 'Cliente'}
                      </p>
                    </div>
                    {projectData?.new_clients?.client_status === 'prospect' && (
                      <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                        ⚠️ Los prospectos no pueden tener códigos de producción
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md border">
                    <label className="text-sm font-medium text-gray-700">Código del Proyecto</label>
                    <p className="text-lg font-mono font-semibold text-gray-900 mt-1">
                      {projectData?.project_code || projectData?.code || 'Sin código'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {projectData?.new_clients?.client_status === 'prospect'
                        ? 'Los códigos se asignan automáticamente al convertir el prospecto en cliente'
                        : 'Código asignado automáticamente al proyecto'
                      }
                    </p>
                  </div>

                  {/* Production Slot Selector - Solo para clientes */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="productionCodeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Producción</FormLabel>
                          <FormControl>
                            <ProjectCodeSelector
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isLoading || projectData?.new_clients?.client_status === 'prospect'}
                              allowEmpty={true}
                              isProspect={projectData?.new_clients?.client_status === 'prospect'}
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-sm text-gray-600 mt-1">
                            {projectData?.new_clients?.client_status === 'prospect' ? (
                              <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border-l-4 border-yellow-200">
                                ⚠️ <strong>Prospecto:</strong> Convierte al cliente para poder asignar códigos de producción
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">
                                Puedes asignar un código de producción disponible para planificar las fechas de entrega
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Comercial Selector */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="comercial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comercial Asignado</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar comercial" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Arnau">Arnau</SelectItem>
                              <SelectItem value="Youssef">Youssef</SelectItem>
                              <SelectItem value="David">David</SelectItem>
                              <SelectItem value="Cristina">Cristina</SelectItem>
                              <SelectItem value="Marc">Marc</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Información del Cliente */}
              <TabsContent value="cliente" className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del cliente" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientDni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNI</FormLabel>
                        <FormControl>
                          <Input placeholder="DNI del cliente" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl>
                          <Input placeholder="Teléfono del cliente" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@ejemplo.com" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección completa del cliente" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientBirthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Información de Facturación */}
              <TabsContent value="facturacion" className="space-y-4">
                <BillingInfoForm form={form} disabled={isLoading} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Proyecto'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectForm;