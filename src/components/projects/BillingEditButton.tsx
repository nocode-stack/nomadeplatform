import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateBilling } from '../../hooks/useBilling';
import { useBillingData } from '../../hooks/useBillingData';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
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
import { Edit, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const billingSchema = z.object({
  type: z.string().min(1, 'Selecciona el tipo de facturación'),
  name: z.string().optional(),
  nif: z.string().optional(),
  email: z.string().email('Email válido').optional().or(z.literal('')),
  phone: z.string().optional(),
  billing_address: z.string().optional(),
});

type BillingData = z.infer<typeof billingSchema>;

interface BillingEditButtonProps {
  project: any;
  onBillingUpdated: () => void;
}

const BillingEditButton: React.FC<BillingEditButtonProps> = ({ project, onBillingUpdated }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const updateBilling = useUpdateBilling();

  // Usar el hook personalizado para cargar datos de facturación automáticamente
  const { data: billingData, isLoading: isBillingLoading, error: billingError, refetch } = useBillingData(project?.new_clients?.id);

  if (import.meta.env.DEV) console.log('🔧 BillingEditButton state:', {
    projectId: project?.id,
    clientId: project?.new_clients?.id,
    isBillingLoading,
    billingData,
    billingError,
    dialogOpen: open
  });

  const form = useForm<BillingData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      type: 'individual',
      name: '',
      nif: '',
      email: '',
      phone: '',
      billing_address: '',
    },
  });

  // Función que fuerza la carga y llenado de datos del formulario
  const loadAndFillFormData = async () => {
    if (import.meta.env.DEV) console.log('🎯 TRIGGER: Forzando carga de datos de facturación');
    
    try {
      // 1. Forzar refetch de datos de facturación
      const { data: freshBillingData } = await refetch();
      if (import.meta.env.DEV) console.log('🔄 Fresh billing data fetched:', freshBillingData);
      
      let formData;
      
      if (freshBillingData) {
        // Usar datos de facturación existentes
        formData = {
          type: freshBillingData.type as 'individual' | 'company',
          name: freshBillingData.name || '',
          nif: freshBillingData.nif || '',
          email: freshBillingData.email || '',
          phone: freshBillingData.phone || '',
          billing_address: freshBillingData.billing_address || '',
        };
        if (import.meta.env.DEV) console.log('✅ TRIGGER: Usando datos de facturación guardados:', formData);
      } else if (project?.new_clients) {
        // Auto-llenar con datos del cliente si no hay facturación
        formData = {
          type: 'individual' as const,
          name: project.new_clients.name || '',
          nif: project.new_clients.dni || '',
          email: project.new_clients.email || '',
          phone: project.new_clients.phone || '',
          billing_address: project.new_clients.address || '',
        };
        if (import.meta.env.DEV) console.log('📝 TRIGGER: No hay datos de facturación, usando datos del cliente:', formData);
      } else {
        if (import.meta.env.DEV) console.log('❌ TRIGGER: No hay datos disponibles');
        return;
      }
      
      // 2. Resetear el formulario con los datos cargados
      form.reset(formData);
      if (import.meta.env.DEV) console.log('🎯 TRIGGER: Formulario reseteado con datos:', formData);
      
    } catch (error) {
      console.error('❌ TRIGGER: Error cargando datos:', error);
    }
  };

  // Manejar apertura del diálogo con trigger de carga
  const handleOpenDialog = async () => {
    if (import.meta.env.DEV) console.log('🚀 TRIGGER: Abriendo diálogo y cargando datos...');
    setOpen(true);
    
    // Pequeño delay para asegurar que el diálogo esté montado
    setTimeout(() => {
      loadAndFillFormData();
    }, 150);
  };

  // useEffect solo para casos donde los datos cambian mientras el diálogo está abierto
  useEffect(() => {
    if (open && billingData) {
      if (import.meta.env.DEV) console.log('🔄 BACKUP: useEffect detectó cambio en billingData:', billingData);
      const formData = {
        type: billingData.type as 'individual' | 'company',
        name: billingData.name || '',
        nif: billingData.nif || '',
        email: billingData.email || '',
        phone: billingData.phone || '',
        billing_address: billingData.billing_address || '',
      };
      form.reset(formData);
    }
  }, [billingData, open, form]);

  const onSubmit = async (data: BillingData) => {
    if (!project?.new_clients?.id) {
      toast({
        title: "Error",
        description: "No se encontró el cliente del proyecto",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await updateBilling.mutateAsync({
        clientId: project.new_clients.id,
        data: {
          type: data.type,
          name: data.name || null,
          nif: data.nif || null,
          email: data.email || null,
          phone: data.phone || null,
          billing_address: data.billing_address || null,
        }
      });

      setOpen(false);
      onBillingUpdated();
    } catch (error: any) {
      console.error('Error updating billing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const billingType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (import.meta.env.DEV) console.log('🔔 Dialog onOpenChange triggered:', isOpen);
      if (isOpen) {
        // Si se está abriendo el diálogo, ejecutar nuestro trigger
        if (import.meta.env.DEV) console.log('🚀 EJECUTANDO TRIGGER desde onOpenChange');
        setOpen(true);
        setTimeout(() => {
          loadAndFillFormData();
        }, 200);
      } else {
        setOpen(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            if (import.meta.env.DEV) console.log('🎯 BOTÓN CLICKEADO - Ejecutando trigger manual');
            e.preventDefault();
            handleOpenDialog();
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Facturación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Datos de Facturación</DialogTitle>
          <DialogDescription>
            Modifica la información de facturación para este proyecto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Facturación</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual">Persona física (individual)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="company" />
                        <Label htmlFor="company">Empresa</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {billingType === 'company' ? 'Nombre de la Empresa' : 'Nombre Completo'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {billingType === 'company' ? 'CIF' : 'NIF/DNI'}
                    </FormLabel>
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
                name="phone"
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
            </div>

            <FormField
              control={form.control}
              name="billing_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección de Facturación</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BillingEditButton;