
import React, { useState, useEffect } from 'react';
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
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, User, FileText, Settings, Plus, Users, Info } from 'lucide-react';
import BillingInfoForm from './BillingInfoForm';
import ProjectCodeSelector from './ProjectCodeSelector';
import { useProjects } from '../../hooks/useNewProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';

const newProjectSchema = z.object({
  // Tipo de cliente
  clientType: z.enum(['prospect', 'client']).default('prospect'),
  
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

type NewProjectFormData = z.infer<typeof newProjectSchema>;

interface NewProjectFormProps {
  onProjectCreated: (projectData: any) => void;
}

const NewProjectForm = ({ onProjectCreated }: NewProjectFormProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createProject } = useProjects();
  
  const form = useForm<NewProjectFormData>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      clientType: 'prospect',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientDni: '',
      clientAddress: '',
      clientBirthDate: '',
      productionCodeId: '',
      comercial: '',
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
    },
  });

  const watchedClientType = form.watch('clientType');
  const watchedClientName = form.watch('clientName');
  const watchedClientEmail = form.watch('clientEmail');

  // Solo generar código si es cliente (no prospect)
  const { data: nextProjectCode } = useQuery({
    queryKey: ['next-project-code'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('generate_project_code');
      if (error) throw error;
      return data;
    },
    enabled: open && watchedClientType === 'client',
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const onSubmit = async (data: NewProjectFormData) => {
    setIsLoading(true);
    
    try {
      // Adaptar datos para el hook existente
      const adaptedData = {
        clientType: data.clientType,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientDni: data.clientDni || '',
        clientAddress: data.clientAddress || '',
        clientBirthDate: data.clientBirthDate || '',
        comercial: data.comercial || '',
        billingType: data.billingType === 'personal' ? 'personal' : 
                     data.billingType === 'other_person' ? 'personal' : 'company',
        billingName: data.billingType === 'personal' ? data.clientName : 
                     data.billingType === 'other_person' ? data.otherPersonName :
                     data.clientBillingCompanyName,
        billingEmail: data.billingType === 'personal' ? data.clientEmail : 
                      data.billingType === 'other_person' ? data.otherPersonEmail :
                      data.clientBillingCompanyEmail,
        billingPhone: data.billingType === 'personal' ? data.clientPhone : 
                      data.billingType === 'other_person' ? data.otherPersonPhone :
                      data.clientBillingCompanyPhone,
        billingAddress: data.billingType === 'personal' ? data.clientAddress : 
                        data.billingType === 'other_person' ? data.otherPersonAddress :
                        data.clientBillingCompanyAddress,
        billingDni: data.billingType === 'other_person' ? data.otherPersonDni : '',
        billingCompanyCif: data.billingType === 'company' ? data.clientBillingCompanyCif : '',
      };

      await createProject(adaptedData);
      onProjectCreated(adaptedData);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Crea un nuevo proyecto especificando el tipo de cliente y su información.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="tipo-cliente" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tipo-cliente" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tipo Cliente
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

              {/* Tipo de Cliente */}
              <TabsContent value="tipo-cliente" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tipo de Cliente</h3>
                  
                  {/* Código del Proyecto */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>Código del Proyecto</span>
                      </CardTitle>
                      <CardDescription>
                        {watchedClientType === 'client' ? (
                          'Se asignará automáticamente al crear el proyecto'
                        ) : (
                          'Los prospects no reciben código hasta convertirse en clientes'
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Input 
                            value={
                              watchedClientType === 'client' 
                                ? nextProjectCode || 'Generando...' 
                                : 'Código pendiente'
                            }
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <Badge variant={watchedClientType === 'client' ? 'default' : 'secondary'}>
                          {watchedClientType === 'client' ? 'Cliente' : 'Prospect'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selector de Tipo de Cliente */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Seleccionar Tipo de Cliente</CardTitle>
                      <CardDescription>
                        Especifica si es un cliente confirmado o un prospect
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="clientType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-4">
                                <div 
                                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    field.value === 'prospect' 
                                      ? 'border-orange-500 bg-orange-50' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => field.onChange('prospect')}
                                >
                                  <div className="flex items-center space-x-2 mb-2">
                                    <User className="h-4 w-4 text-orange-600" />
                                    <span className="font-medium">Prospect</span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Cliente potencial que aún no ha confirmado la compra
                                  </p>
                                </div>
                                
                                <div 
                                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    field.value === 'client' 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => field.onChange('client')}
                                >
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">Cliente</span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Cliente confirmado que procederá con la compra
                                  </p>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Información importante para prospects */}
                  {watchedClientType === 'prospect' && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-orange-800">Información sobre Prospects</h4>
                            <p className="text-sm text-orange-700 mt-1">
                              Los prospects no reciben código de proyecto hasta convertirse en clientes confirmados. 
                              Podrás cambiar el estado posteriormente desde la gestión de proyectos.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Código de Producción solo para clientes */}
                  {watchedClientType === 'client' && (
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="productionCodeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Producción (Opcional)</FormLabel>
                            <FormControl>
                              <ProjectCodeSelector
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={isLoading}
                                allowEmpty={true} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Comercial */}
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
                    Creando...
                  </>
                ) : (
                  'Crear Proyecto'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectForm;
