
import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

interface BillingInfoFormProps {
  form: UseFormReturn<any>;
  disabled?: boolean;
}

const BillingInfoForm = ({ form, disabled = false }: BillingInfoFormProps) => {
  const billingType = form.watch('billingType');

  // Auto-rellenar datos de facturación cuando se selecciona "personal"
  useEffect(() => {
    if (billingType === 'personal') {
      const clientName = form.getValues('clientName');
      const clientEmail = form.getValues('clientEmail');
      const clientPhone = form.getValues('clientPhone');
      const clientAddress = form.getValues('clientAddress');

      // Solo auto-rellenar si los datos del cliente son válidos
      if (clientName && clientName.length > 0) {
        form.setValue('clientBillingName', clientName, { shouldValidate: true });
      }
      if (clientEmail && clientEmail.includes('@')) {
        form.setValue('clientBillingEmail', clientEmail, { shouldValidate: true });
      }
      if (clientPhone && clientPhone.length > 0) {
        form.setValue('clientBillingPhone', clientPhone, { shouldValidate: true });
      }
      if (clientAddress && clientAddress.length > 0) {
        form.setValue('clientBillingAddress', clientAddress, { shouldValidate: true });
      }

      // Forzar revalidación del formulario
      setTimeout(() => {
        form.trigger(['clientBillingName', 'clientBillingEmail', 'clientBillingPhone', 'clientBillingAddress']);
      }, 100);
    }
  }, [billingType, form]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Información de Facturación</h3>

        <FormField
          control={form.control}
          name="billingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-foreground">Tipo de Facturación</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue="personal"
                  value={field.value || 'personal'}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal" className="font-medium">Datos del cliente (auto-rellenados)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other_person" id="other_person" />
                    <Label htmlFor="other_person" className="font-medium">Datos de otra persona física</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="company" />
                    <Label htmlFor="company" className="font-medium">Datos de empresa</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {billingType === 'personal' && (
        <div className="space-y-4 border-l-4 border-primary pl-4">
          <h4 className="font-bold text-foreground">Datos del Cliente (Auto-rellenados)</h4>
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <p className="text-sm text-foreground/80">
              💡 <strong>Información:</strong> Los campos se rellenan automáticamente con los datos del cliente.
              Estos datos se usarán para la facturación.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientBillingName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nombre de Facturación</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Auto-rellenado con datos del cliente" disabled={disabled || true} className="rounded-xl border-border bg-muted/30" />
                  </FormControl>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                    Datos del cliente actual
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Email de Facturación</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="Auto-rellenado con datos del cliente" disabled={disabled || true} className="rounded-xl border-border bg-muted/30" />
                  </FormControl>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                    Datos del cliente actual
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Teléfono de Facturación</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Auto-rellenado con datos del cliente" disabled={disabled || true} className="rounded-xl border-border bg-muted/30" />
                  </FormControl>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                    Datos del cliente actual
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Dirección de Facturación</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Auto-rellenado con datos del cliente" disabled={disabled || true} className="rounded-xl border-border bg-muted/30" />
                  </FormControl>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                    Datos del cliente actual
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {billingType === 'other_person' && (
        <div className="space-y-4 border-l-4 border-secondary pl-4">
          <h4 className="font-bold text-foreground">Datos de Otra Persona Física</h4>
          <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
            <p className="text-sm text-foreground/80">
              👤 <strong>Facturación a otra persona:</strong> Completa los datos de la persona que aparecerá en la factura.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="otherPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre de la persona a facturar" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="email@ejemplo.com" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Teléfono de contacto" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonDni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">DNI</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12345678X" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="font-bold">Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dirección completa" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {billingType === 'company' && (
        <div className="space-y-4 border-l-4 border-success pl-4">
          <h4 className="font-bold text-foreground">Datos de Empresa</h4>
          <div className="bg-success/5 p-4 rounded-xl border border-success/10">
            <p className="text-sm text-foreground/80">
              🏢 <strong>Facturación empresarial:</strong> Completa los datos de la empresa para la facturación.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientBillingCompanyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nombre de la Empresa *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Razón social de la empresa" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyCif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">CIF de la Empresa *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="A12345678" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Email de la Empresa</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="contacto@empresa.com" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Teléfono de la Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Teléfono de contacto" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="font-bold">Dirección de la Empresa *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dirección fiscal de la empresa" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingInfoForm;
