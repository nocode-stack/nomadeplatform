
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
import { Phone, Mail, Calendar } from 'lucide-react';

interface BillingInfoFormProps {
  form: UseFormReturn<any>;
  disabled?: boolean;
}

const BillingInfoForm = ({ form, disabled = false }: BillingInfoFormProps) => {
  const billingType = form.watch('billingType');

  // Auto-fill billing fields when 'personal' is selected
  useEffect(() => {
    if (billingType === 'personal') {
      const clientName = form.getValues('clientName');
      const clientSurname = form.getValues('clientSurname');
      const clientEmail = form.getValues('clientEmail');
      const clientPhone = form.getValues('clientPhone');

      if (clientName) form.setValue('clientBillingName', clientName, { shouldValidate: true });
      if (clientSurname) form.setValue('clientBillingSurname', clientSurname, { shouldValidate: true });
      if (clientEmail) form.setValue('clientBillingEmail', clientEmail, { shouldValidate: true });
      if (clientPhone) form.setValue('clientBillingPhone', clientPhone, { shouldValidate: true });
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
                    <Label htmlFor="personal" className="font-medium">Datos del cliente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="company" />
                    <Label htmlFor="company" className="font-medium">Datos de empresa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other_person" id="other_person" />
                    <Label htmlFor="other_person" className="font-medium">Datos de otra persona física</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ── PERSONAL: Read-only client data ── */}
      {billingType === 'personal' && (
        <div className="space-y-4 border-l-4 border-primary pl-4">
          <h4 className="font-bold text-foreground">Datos del Cliente</h4>
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <p className="text-sm text-foreground/80">
              💡 <strong>Información:</strong> Los campos se rellenan automáticamente con los datos del cliente. No son editables.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientBillingName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nombre Facturación</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} className="rounded-xl border-border bg-muted/30" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingSurname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Apellidos Facturación</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} className="rounded-xl border-border bg-muted/30" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Teléfono Facturación</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} disabled={true} className="pl-10 rounded-xl border-border bg-muted/30" />
                    </div>
                  </FormControl>
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
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" {...field} disabled={true} className="pl-10 rounded-xl border-border bg-muted/30" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {/* ── EMPRESA: All fields required ── */}
      {billingType === 'company' && (
        <div className="space-y-4 border-l-4 border-success pl-4">
          <h4 className="font-bold text-foreground">Datos de Empresa</h4>
          <div className="bg-success/5 p-4 rounded-xl border border-success/10">
            <p className="text-sm text-foreground/80">
              🏢 <strong>Facturación empresarial:</strong> Completa los datos de la empresa. Todos los campos son obligatorios.
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
                  <FormLabel className="font-bold">CIF *</FormLabel>
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
                  <FormLabel className="font-bold">Email *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" {...field} placeholder="contacto@empresa.com" disabled={disabled} className="pl-10 rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                    </div>
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
                  <FormLabel className="font-bold">Teléfono *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} placeholder="Teléfono de la empresa" disabled={disabled} className="pl-10 rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">País *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: España" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyAutonomousCommunity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Comunidad Autónoma *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Catalunya" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Ciudad *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Barcelona" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Dirección empresa *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dirección fiscal de la empresa" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientBillingCompanyAddressNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Número (oficina/local) *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Planta 3, Oficina 2" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {/* ── OTRA PERSONA: Same structure as client info, all editable ── */}
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
                  <FormLabel className="font-bold">Nombre *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonSurname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Apellidos *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Apellidos" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
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
                  <FormLabel className="font-bold">Teléfono *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} placeholder="Teléfono de contacto" disabled={disabled} className="pl-10 rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                    </div>
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
                  <FormLabel className="font-bold">Email *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" {...field} placeholder="email@ejemplo.com" disabled={disabled} className="pl-10 rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                    </div>
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
                  <FormLabel className="font-bold">DNI / CIF</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12345678X" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonBirthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Data de Naixement</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="date" {...field} disabled={disabled} className="pl-10 rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">País *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: España" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonAutonomousCommunity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Comunidad Autónoma *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Catalunya" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Ciudad</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dirección completa" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPersonAddressNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Número (puerta/piso)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: 3-2ª" disabled={disabled} className="rounded-xl border-border focus:ring-primary/10 focus:border-primary" />
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
