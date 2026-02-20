
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Edit, User, Settings, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const projectInfoSchema = z.object({
  // Cliente
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email válido requerido'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  dni: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  
  // Proyecto
  model: z.string().min(1, 'El modelo es obligatorio'),
  power: z.string().optional(),
  interiorColor: z.string().optional(),
  exteriorColor: z.string().optional(),
  year: z.string().optional(),
  serialNumber: z.string().optional(),
  electricSystem: z.string().optional(),
  extraPackages: z.string().optional(),
  
  // Facturación - campos que coinciden con NEW_Billing
  billingType: z.string().optional(),
  billingName: z.string().optional(),
  billingNif: z.string().optional(),
  billingAddress: z.string().optional(),
  billingPhone: z.string().optional(),
  billingEmail: z.string().optional(),
});

type ProjectInfoData = z.infer<typeof projectInfoSchema>;

interface ProjectInfo {
  client: {
    name: string;
    email: string;
    phone: string;
    dni?: string;
    address?: string;
    birthDate?: string;
  };
  specifications: {
    model: string;
    power?: string;
    interiorColor?: string;
    exteriorColor?: string;
    year?: string;
    serialNumber?: string;
    electricSystem?: string;
    extraPackages?: string;
  };
  billing: {
    type?: string;
    name?: string;
    nif?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

interface ProjectInfoEditorProps {
  projectInfo: ProjectInfo;
  clientId: string;
  onProjectInfoUpdated: (projectInfo: ProjectInfo) => void;
}

const ProjectInfoEditor = ({ projectInfo, clientId, onProjectInfoUpdated }: ProjectInfoEditorProps) => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<ProjectInfoData>({
    resolver: zodResolver(projectInfoSchema),
    defaultValues: {
      // Cliente
      name: projectInfo.client.name,
      email: projectInfo.client.email,
      phone: projectInfo.client.phone,
      dni: projectInfo.client.dni || '',
      address: projectInfo.client.address || '',
      birthDate: projectInfo.client.birthDate || '',
      
      // Proyecto
      model: projectInfo.specifications.model,
      power: projectInfo.specifications.power || '',
      interiorColor: projectInfo.specifications.interiorColor || '',
      exteriorColor: projectInfo.specifications.exteriorColor || '',
      year: projectInfo.specifications.year || '',
      serialNumber: projectInfo.specifications.serialNumber || '',
      electricSystem: projectInfo.specifications.electricSystem || '',
      extraPackages: projectInfo.specifications.extraPackages || '',
      
      // Facturación - usar projectInfo.billing como los datos del cliente
      billingType: projectInfo.billing.type || '',
      billingName: projectInfo.billing.name || '',
      billingNif: projectInfo.billing.nif || '',
      billingAddress: projectInfo.billing.address || '',
      billingPhone: projectInfo.billing.phone || '',
      billingEmail: projectInfo.billing.email || '',
    },
  });


  const onSubmit = async (data: ProjectInfoData) => {
    try {
      if (import.meta.env.DEV) console.log('💾 ProjectInfoEditor: Guardando datos...', data);
      
      // Actualizar projectInfo con todos los datos (incluido billing)
      const updatedProjectInfo: ProjectInfo = {
        client: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          dni: data.dni || undefined,
          address: data.address || undefined,
          birthDate: data.birthDate || undefined,
        },
        specifications: {
          model: data.model,
          power: data.power || undefined,
          interiorColor: data.interiorColor || undefined,
          exteriorColor: data.exteriorColor || undefined,
          year: data.year || undefined,
          serialNumber: data.serialNumber || undefined,
          electricSystem: data.electricSystem || undefined,
          extraPackages: data.extraPackages || undefined,
        },
        billing: {
          type: data.billingType || undefined,
          name: data.billingName || undefined,
          nif: data.billingNif || undefined,
          address: data.billingAddress || undefined,
          phone: data.billingPhone || undefined,
          email: data.billingEmail || undefined,
        }
      };
      
      onProjectInfoUpdated(updatedProjectInfo);
      
      toast.success('Información actualizada correctamente');
      if (import.meta.env.DEV) console.log('✅ ProjectInfoEditor: Datos guardados exitosamente');
      setOpen(false);
      
    } catch (error) {
      console.error('❌ ProjectInfoEditor: Error inesperado:', error);
      toast.error('Error inesperado al guardar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-1">
          <Edit className="h-3 w-3" />
          <span>Editar Información</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Editar Información del Proyecto</span>
          </DialogTitle>
          <DialogDescription>
            Modifica la información del cliente, proyecto y facturación. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="cliente" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cliente" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="proyecto" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Proyecto
                </TabsTrigger>
                <TabsTrigger value="facturacion" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Facturación
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNI</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="proyecto" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="power"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motorización</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ej: 140cv" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="interiorColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Mobiliario</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="exteriorColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Exterior</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Año</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Serie</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="electricSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sistema Eléctrico</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="extraPackages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paquetes Extra</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="facturacion" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="billingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Personal/Empresa" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billingNif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIF/CIF</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345678Z" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billingPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billingEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectInfoEditor;
