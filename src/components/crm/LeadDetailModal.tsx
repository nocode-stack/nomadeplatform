
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Loader2, User, FileText, Mail, Phone, Calendar, Users, Wallet } from 'lucide-react';
import AnimatedFlame from '../ui/AnimatedFlame';
import BillingInfoForm from '../projects/BillingInfoForm';
import BudgetListTab from './BudgetListTab';
import ContractsTab from './ContractsTab';
import { useClients, useToggleHotLead } from '../../hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const leadDetailSchema = z.object({
    // Información del Cliente
    leadType: z.string().optional().default(''),
    fair: z.string().optional(),
    clientName: z.string().min(1, 'El nombre es obligatorio'),
    clientSurname: z.string().optional().default(''),
    clientPhone: z.string().min(1, 'El teléfono es obligatorio'),
    clientEmail: z.string().email('Email válido requerido'),
    clientDni: z.string().optional(),
    clientBirthDate: z.string().optional(),
    comercial: z.string().optional().default(''),
    country: z.string().optional().default(''),
    autonomousCommunity: z.string().optional().default(''),
    city: z.string().optional(),
    clientAddress: z.string().optional(),
    addressNumber: z.string().optional(),

    // Proyecto
    vehicleModel: z.string().optional(),
    motorization: z.string().optional(),
    furnitureColor: z.string().optional(),
    exteriorColor: z.string().optional(),
    productionSlot: z.string().optional(),
    electricalSystem: z.string().optional(),
    extraPacks: z.string().optional(),
    projectNotes: z.string().optional(),

    // Facturación
    billingType: z.enum(['personal', 'other_person', 'company']).default('personal'),
    clientBillingName: z.string().optional(),
    clientBillingSurname: z.string().optional(),
    clientBillingEmail: z.string().optional(),
    clientBillingPhone: z.string().optional(),
    clientBillingAddress: z.string().optional(),
    otherPersonName: z.string().optional(),
    otherPersonSurname: z.string().optional(),
    otherPersonEmail: z.string().optional(),
    otherPersonPhone: z.string().optional(),
    otherPersonAddress: z.string().optional(),
    otherPersonDni: z.string().optional(),
    otherPersonCountry: z.string().optional(),
    otherPersonAutonomousCommunity: z.string().optional(),
    otherPersonCity: z.string().optional(),
    otherPersonAddressNumber: z.string().optional(),
    otherPersonBirthDate: z.string().optional(),
    clientBillingCompanyName: z.string().optional(),
    clientBillingCompanyCif: z.string().optional(),
    clientBillingCompanyPhone: z.string().optional(),
    clientBillingCompanyEmail: z.string().optional(),
    clientBillingCompanyAddress: z.string().optional(),
    clientBillingCompanyCountry: z.string().optional(),
    clientBillingCompanyAutonomousCommunity: z.string().optional(),
    clientBillingCompanyCity: z.string().optional(),
    clientBillingCompanyAddressNumber: z.string().optional(),
    discount: z.string().optional().default('0'),
    budgetNotes: z.string().optional(),
    items: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().default(1),
        is_custom: z.boolean().default(true),
        save_as_template: z.boolean().default(false),
    })).optional().default([]),
});

type LeadDetailFormData = z.infer<typeof leadDetailSchema>;

interface LeadDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: any;
    onLeadUpdated?: (leadData: any) => void;
}

const LeadDetailModal = ({ open, onOpenChange, lead, onLeadUpdated }: LeadDetailModalProps) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('cliente');
    const [clientSubTab, setClientSubTab] = React.useState<'contacto' | 'facturacion'>('contacto');
    const [currentProjectId, setCurrentProjectId] = React.useState(lead?.id);
    const [isHotLead, setIsHotLead] = React.useState(lead?.isHotLead || false);
    const [isContractFormOpen, setIsContractFormOpen] = React.useState(false);
    const toggleHotLeadMutation = useToggleHotLead();

    useEffect(() => {
        setCurrentProjectId(lead?.id);
        setIsHotLead(lead?.isHotLead || false);
    }, [lead?.id, lead?.isHotLead]);
    const { toast } = useToast();

    const form = useForm<LeadDetailFormData>({
        resolver: zodResolver(leadDetailSchema),
        defaultValues: {
            leadType: lead?.leadType || '',
            fair: lead?.fair || '',
            clientName: lead?.name || '',
            clientSurname: lead?.surname || '',
            clientPhone: lead?.phone || '',
            clientEmail: lead?.email || '',
            clientDni: lead?.dni || '',
            clientBirthDate: lead?.birthDate || lead?.birthdate || '',
            comercial: lead?.comercial || '',
            country: lead?.country || '',
            autonomousCommunity: lead?.autonomousCommunity || '',
            city: lead?.city || '',
            clientAddress: lead?.address || '',
            addressNumber: lead?.addressNumber || '',
            vehicleModel: lead?.vehicleModel || '',
            motorization: lead?.motorization || '',
            furnitureColor: lead?.furnitureColor || '',
            exteriorColor: lead?.exteriorColor || '',
            productionSlot: lead?.productionSlot || '',
            electricalSystem: lead?.electricalSystem || '',
            extraPacks: lead?.extraPacks || 'Pack Nomade',
            projectNotes: lead?.projectNotes || '',
            billingType: lead?.billingType || 'personal',
            discount: lead?.discount || '0',
            budgetNotes: lead?.budgetNotes || '',
            items: [],
        },
    });

    useEffect(() => {
        if (lead) {
            form.reset({
                leadType: lead.leadType || '',
                fair: lead.fair || '',
                clientName: lead.name || '',
                clientSurname: lead.surname || '',
                clientPhone: lead.phone || '',
                clientEmail: lead.email || '',
                clientDni: lead.dni || '',
                clientBirthDate: lead.birthDate || lead.birthdate || '',
                comercial: lead.comercial || '',
                country: lead.country || '',
                autonomousCommunity: lead.autonomousCommunity || '',
                city: lead.city || '',
                clientAddress: lead.address || '',
                addressNumber: lead.addressNumber || '',
                vehicleModel: lead.vehicleModel || '',
                motorization: lead.motorization || '',
                furnitureColor: lead.furnitureColor || '',
                exteriorColor: lead.exteriorColor || '',
                productionSlot: lead.productionSlot || '',
                electricalSystem: lead.electricalSystem || '',
                extraPacks: lead.extraPacks || 'Pack Nomade',
                projectNotes: lead.projectNotes || '',
                billingType: lead.billingType || 'personal',
                discount: lead.discount || '0',
                budgetNotes: lead.budgetNotes || '',
                items: lead.items || [],
            });

            // Fetch billing data from billing table
            const clientId = lead.client_id || lead._raw?.id;
            if (clientId) {
                supabase
                    .from('billing')
                    .select('*')
                    .eq('client_id', clientId)
                    .maybeSingle()
                    .then(({ data: billing }) => {
                        if (billing) {
                            const billingType = (billing.type as 'personal' | 'other_person' | 'company') || 'personal';
                            form.setValue('billingType', billingType);

                            if (billingType === 'personal') {
                                form.setValue('clientBillingName', billing.name || '');
                                form.setValue('clientBillingEmail', billing.email || '');
                                form.setValue('clientBillingPhone', billing.phone || '');
                                form.setValue('clientBillingAddress', billing.billing_address || '');
                            } else if (billingType === 'other_person') {
                                form.setValue('otherPersonName', billing.name || '');
                                form.setValue('otherPersonEmail', billing.email || '');
                                form.setValue('otherPersonPhone', billing.phone || '');
                                form.setValue('otherPersonDni', billing.nif || '');
                                // Cargar campos individuales de dirección de otra persona
                                const bAny = billing as any;
                                form.setValue('otherPersonSurname', bAny.surname || '');
                                form.setValue('otherPersonAddress', bAny.address_street || billing.billing_address || '');
                                form.setValue('otherPersonAddressNumber', bAny.office_unit || '');
                                form.setValue('otherPersonCountry', bAny.country || '');
                                form.setValue('otherPersonAutonomousCommunity', bAny.autonomous_community || '');
                                form.setValue('otherPersonCity', bAny.city || '');
                                form.setValue('otherPersonBirthDate', bAny.birth_date || '');
                            } else if (billingType === 'company') {
                                form.setValue('clientBillingCompanyName', billing.name || '');
                                form.setValue('clientBillingCompanyCif', billing.nif || '');
                                form.setValue('clientBillingCompanyPhone', billing.phone || '');
                                form.setValue('clientBillingCompanyEmail', billing.email || '');
                                // Cargar campos individuales de dirección de empresa
                                const bAny = billing as any;
                                form.setValue('clientBillingCompanyAddress', bAny.address_street || '');
                                form.setValue('clientBillingCompanyAddressNumber', bAny.office_unit || '');
                                form.setValue('clientBillingCompanyCountry', bAny.country || '');
                                form.setValue('clientBillingCompanyAutonomousCommunity', bAny.autonomous_community || '');
                                form.setValue('clientBillingCompanyCity', bAny.city || '');
                            }
                        }
                    });
            }
        }
    }, [lead, form]);

    const onSubmit = async (data: LeadDetailFormData) => {
        if (import.meta.env.DEV) console.log('✅ Form submission valid, saving client data:', data);
        setIsLoading(true);
        try {
            const clientId = lead?.client_id || lead?._raw?.id;
            if (!clientId) throw new Error('No se encontró el ID del cliente.');

            // 1. Actualizar datos del cliente en clients
            const { error: clientError } = await supabase
                .from('clients')
                .update({
                    name: data.clientName,
                    surname: data.clientSurname || null,
                    email: data.clientEmail,
                    phone: data.clientPhone,
                    dni: data.clientDni || null,
                    address: data.clientAddress || null,
                    address_number: data.addressNumber || null,
                    birthdate: data.clientBirthDate || null,
                    comercial: data.comercial || null,
                    lead_type: data.leadType || null,
                    fair: data.fair || null,
                    country: data.country || null,
                    autonomous_community: data.autonomousCommunity || null,
                    city: data.city || null,
                })
                .eq('id', clientId);

            if (clientError) throw clientError;

            // 2. Actualizar comercial en projects (siempre, incluso si se vacía)
            if (lead?.id) {
                await supabase
                    .from('projects')
                    .update({ comercial: data.comercial || null })
                    .eq('id', lead.id);
            }

            // 3. Actualizar datos de facturación en billing
            if (data.billingType) {
                let billingName: string, billingEmail: string, billingPhone: string,
                    billingAddress: string, billingNif: string;

                if (data.billingType === 'company') {
                    billingName = data.clientBillingCompanyName || data.clientName;
                    billingEmail = data.clientBillingCompanyEmail || data.clientEmail;
                    billingPhone = data.clientBillingCompanyPhone || data.clientPhone;
                    // Solo la dirección de calle, sin concatenar
                    billingAddress = data.clientBillingCompanyAddress || data.clientAddress || '';
                    billingNif = data.clientBillingCompanyCif || '';
                } else if (data.billingType === 'other_person') {
                    billingName = data.otherPersonName || data.clientName;
                    billingEmail = data.otherPersonEmail || data.clientEmail;
                    billingPhone = data.otherPersonPhone || data.clientPhone;
                    billingAddress = data.otherPersonAddress || data.clientAddress || '';
                    billingNif = data.otherPersonDni || '';
                } else {
                    // 'personal' — billing mirrors client data directly
                    billingName = data.clientName;
                    billingEmail = data.clientEmail;
                    billingPhone = data.clientPhone;
                    billingAddress = data.clientAddress || '';
                    billingNif = data.clientDni || '';
                }

                const billingData = {
                    client_id: clientId,
                    name: billingName,
                    email: billingEmail,
                    phone: billingPhone,
                    billing_address: billingAddress,
                    nif: billingNif,
                    type: data.billingType,
                    // Guardar campos individuales de dirección
                    ...(data.billingType === 'company' ? {
                        country: data.clientBillingCompanyCountry || '',
                        autonomous_community: data.clientBillingCompanyAutonomousCommunity || '',
                        city: data.clientBillingCompanyCity || '',
                        address_street: data.clientBillingCompanyAddress || '',
                        office_unit: data.clientBillingCompanyAddressNumber || '',
                    } : data.billingType === 'other_person' ? {
                        surname: data.otherPersonSurname || '',
                        country: data.otherPersonCountry || '',
                        autonomous_community: data.otherPersonAutonomousCommunity || '',
                        city: data.otherPersonCity || '',
                        address_street: data.otherPersonAddress || '',
                        office_unit: data.otherPersonAddressNumber || '',
                        birth_date: data.otherPersonBirthDate || null,
                    } : {
                        // personal — sync client address fields to billing
                        surname: data.clientSurname || '',
                        country: data.country || '',
                        autonomous_community: data.autonomousCommunity || '',
                        city: data.city || '',
                        address_street: data.clientAddress || '',
                        office_unit: data.addressNumber || '',
                        birth_date: data.clientBirthDate || null,
                    }),
                };

                const { data: existingBilling } = await supabase
                    .from('billing')
                    .select('id')
                    .eq('client_id', clientId)
                    .maybeSingle();

                if (existingBilling) {
                    await supabase.from('billing').update(billingData).eq('id', existingBilling.id);
                } else {
                    await supabase.from('billing').insert(billingData);
                }
            }

            // Notificar al padre con los campos mapeados correctamente
            if (onLeadUpdated) {
                onLeadUpdated({
                    ...lead,
                    name: data.clientName,
                    surname: data.clientSurname || '',
                    email: data.clientEmail,
                    phone: data.clientPhone,
                    dni: data.clientDni || '',
                    birthDate: data.clientBirthDate || '',
                    birthdate: data.clientBirthDate || '',
                    address: data.clientAddress || '',
                    addressNumber: data.addressNumber || '',
                    comercial: data.comercial || lead?.comercial || '',
                    leadType: data.leadType || '',
                    fair: data.fair || '',
                    country: data.country || '',
                    autonomousCommunity: data.autonomousCommunity || '',
                    city: data.city || '',
                });
            }

            toast({
                title: "Cliente actualizado",
                description: "La información del cliente se ha guardado correctamente.",
            });
            // Modal stays open after saving
        } catch (error: any) {
            console.error('❌ Error saving client details:', error);
            toast({
                title: "Error",
                description: error.message || "Ha ocurrido un error al guardar los datos.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-save client data when switching tabs away from 'cliente'
    const handleTabChange = async (newTab: string) => {
        if (activeTab === 'cliente' && newTab !== 'cliente') {
            // Silently save client data before switching tabs
            const data = form.getValues();
            const clientId = lead?.client_id || lead?._raw?.id;
            if (clientId) {
                try {
                    await supabase
                        .from('clients')
                        .update({
                            name: data.clientName,
                            surname: data.clientSurname || null,
                            email: data.clientEmail,
                            phone: data.clientPhone,
                            dni: data.clientDni || null,
                            address: data.clientAddress || null,
                            address_number: data.addressNumber || null,
                            birthdate: data.clientBirthDate || null,
                            comercial: data.comercial || null,
                            lead_type: data.leadType || null,
                            fair: data.fair || null,
                            country: data.country || null,
                            autonomous_community: data.autonomousCommunity || null,
                            city: data.city || null,
                        })
                        .eq('id', clientId);

                    // Also save comercial to project
                    if (lead?.id) {
                        await supabase
                            .from('projects')
                            .update({ comercial: data.comercial || null })
                            .eq('id', lead.id);
                    }

                    // Also save billing data — use correct fields based on billingType
                    let bName: string, bEmail: string, bPhone: string, bAddress: string, bNif: string;
                    if (data.billingType === 'company') {
                        bName = data.clientBillingCompanyName || data.clientName;
                        bEmail = data.clientBillingCompanyEmail || data.clientEmail;
                        bPhone = data.clientBillingCompanyPhone || data.clientPhone;
                        // Solo la dirección de calle, sin concatenar
                        bAddress = data.clientBillingCompanyAddress || data.clientAddress || '';
                        bNif = data.clientBillingCompanyCif || '';
                    } else if (data.billingType === 'other_person') {
                        bName = data.otherPersonName || data.clientName;
                        bEmail = data.otherPersonEmail || data.clientEmail;
                        bPhone = data.otherPersonPhone || data.clientPhone;
                        bAddress = data.otherPersonAddress || data.clientAddress || '';
                        bNif = data.otherPersonDni || '';
                    } else {
                        // personal — billing mirrors client data directly
                        bName = data.clientName;
                        bEmail = data.clientEmail;
                        bPhone = data.clientPhone;
                        bAddress = data.clientAddress || '';
                        bNif = data.clientDni || '';
                    }
                    const billingData = {
                        client_id: clientId,
                        name: bName,
                        email: bEmail,
                        phone: bPhone,
                        billing_address: bAddress,
                        nif: bNif,
                        type: data.billingType || 'personal',
                        // Guardar campos individuales de dirección
                        ...(data.billingType === 'company' ? {
                            country: data.clientBillingCompanyCountry || '',
                            autonomous_community: data.clientBillingCompanyAutonomousCommunity || '',
                            city: data.clientBillingCompanyCity || '',
                            address_street: data.clientBillingCompanyAddress || '',
                            office_unit: data.clientBillingCompanyAddressNumber || '',
                        } : data.billingType === 'other_person' ? {
                            surname: data.otherPersonSurname || '',
                            country: data.otherPersonCountry || '',
                            autonomous_community: data.otherPersonAutonomousCommunity || '',
                            city: data.otherPersonCity || '',
                            address_street: data.otherPersonAddress || '',
                            office_unit: data.otherPersonAddressNumber || '',
                            birth_date: data.otherPersonBirthDate || null,
                        } : {
                            // personal — sync client address fields to billing
                            surname: data.clientSurname || '',
                            country: data.country || '',
                            autonomous_community: data.autonomousCommunity || '',
                            city: data.city || '',
                            address_street: data.clientAddress || '',
                            office_unit: data.addressNumber || '',
                            birth_date: data.clientBirthDate || null,
                        }),
                    };

                    const { data: existingBilling } = await supabase
                        .from('billing')
                        .select('id')
                        .eq('client_id', clientId)
                        .maybeSingle();

                    if (existingBilling) {
                        await supabase.from('billing').update(billingData).eq('id', existingBilling.id);
                    } else {
                        await supabase.from('billing').insert(billingData);
                    }

                    toast({
                        title: "Datos guardados",
                        description: "La información del cliente se ha guardado automáticamente.",
                    });
                } catch (error) {
                    console.error('Error auto-saving client data:', error);
                }
            }
        }
        // Reset contract form state when leaving Contratos tab
        if (newTab !== 'contratos') {
            setIsContractFormOpen(false);
        }
        setActiveTab(newTab);
    };

    const onInvalid = (errors: any) => {
        console.warn('❌ Form validation failed:', errors);

        // Build a human-readable list of invalid fields
        const errorFieldNames = Object.keys(errors);
        const errorMessages = errorFieldNames.map(field => {
            const msg = errors[field]?.message || 'Campo inválido';
            return `${field}: ${msg}`;
        });
        console.warn('❌ Invalid fields:', errorMessages);

        const personalInfoFields = ['clientName', 'clientPhone', 'clientEmail', 'clientDni', 'clientBirthDate', 'clientAddress', 'leadType', 'fair', 'clientSurname', 'comercial', 'country', 'autonomousCommunity', 'city', 'addressNumber'];
        const billingFields = ['billingType', 'clientBillingName', 'clientBillingEmail', 'clientBillingPhone', 'clientBillingAddress'];
        const hasPersonalInfoErrors = personalInfoFields.some(field => errors[field]);
        const hasBillingErrors = billingFields.some(field => errors[field]) || errorFieldNames.some(field => field.startsWith('clientBilling') || field.startsWith('otherPerson'));

        if (hasPersonalInfoErrors) {
            setActiveTab('cliente');
            setClientSubTab('contacto');
        } else if (hasBillingErrors) {
            setActiveTab('cliente');
            setClientSubTab('facturacion');
        } else if (errorFieldNames.some(field => field.startsWith('discount') || field.startsWith('items'))) {
            setActiveTab('presupuesto');
        }

        // Show which fields are failing
        const fieldDescriptions = errorFieldNames.slice(0, 3).map(f => errors[f]?.message || f).join(', ');
        toast({
            title: "Información incompleta",
            description: fieldDescriptions || "Por favor, revisa todos los campos obligatorios marcados en rojo.",
            variant: "destructive",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl h-[90vh] flex flex-col p-0 border-none shadow-2xl rounded-2xl bg-card text-foreground animate-scale-in">
                <div className="bg-muted/30 border-b border-border p-6 rounded-t-2xl shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground flex items-center">
                            <div className="p-2 bg-primary rounded-lg text-primary-foreground mr-3 shadow-lg shadow-primary/20">
                                <Users className="w-5 h-5" />
                            </div>
                            Ficha de Contacto: {lead?.name}
                            <Badge className={`ml-4 rounded-full px-3 py-0.5 border font-bold text-[10px] uppercase tracking-wide ${lead?.status === 'client'
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-primary/10 text-primary border-primary/20'
                                }`}>
                                {lead?.status === 'client' ? 'Cliente' : 'Prospect'}
                            </Badge>
                            {/* Hot Lead Toggle */}
                            <button
                                type="button"
                                data-testid="hot-lead-toggle"
                                onClick={() => {
                                    const newValue = !isHotLead;
                                    setIsHotLead(newValue);
                                    if (lead?.client_id) {
                                        toggleHotLeadMutation.mutate({ clientId: lead.client_id, isHotLead: newValue });
                                    }
                                }}
                                className={`ml-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${isHotLead
                                    ? 'bg-orange-500/15 text-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.5)] ring-1 ring-orange-400/30'
                                    : 'bg-muted/50 text-muted-foreground/60 hover:text-orange-400 hover:bg-orange-500/10 hover:ring-1 hover:ring-orange-300/20'
                                    }`}
                                title={isHotLead ? 'Desactivar Hot Lead' : 'Activar Hot Lead'}
                            >
                                <AnimatedFlame size="sm" active={isHotLead} />
                                <span className="text-[10px] tracking-wider uppercase">Hot Lead</span>
                            </button>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1">
                            Consulta y actualiza la información detallada del prospecto o cliente.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 pt-2 bg-card border-b border-border shrink-0">
                                <TabsList className="bg-transparent h-14 w-full p-0">
                                    <TabsTrigger
                                        value="cliente"
                                        className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-1 flex items-center justify-center gap-2 text-muted-foreground font-bold transition-all"
                                    >
                                        <User className="h-4 w-4" />
                                        Información Cliente
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="presupuesto"
                                        className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-1 flex items-center justify-center gap-2 text-muted-foreground font-bold transition-all"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        Presupuesto
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="contratos"
                                        className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-1 flex items-center justify-center gap-2 text-muted-foreground font-bold transition-all"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Contratos
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Sub-tabs para Información Cliente - estilo burbuja */}
                            {activeTab === 'cliente' && (
                                <div className="px-6 py-3 bg-card border-b border-border shrink-0">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setClientSubTab('contacto')}
                                            className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 flex items-center gap-2 ${clientSubTab === 'contacto'
                                                ? 'bg-primary text-white shadow-md shadow-primary/25'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            <User className="h-3.5 w-3.5" />
                                            Contacto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setClientSubTab('facturacion')}
                                            className={`px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 flex items-center gap-2 ${clientSubTab === 'facturacion'
                                                ? 'bg-primary text-white shadow-md shadow-primary/25'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Facturación
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={`flex-1 overflow-y-auto px-8 pb-8 bg-card custom-scrollbar ${activeTab === 'contratos' ? 'pt-0' : 'pt-8'}`}>
                                <TabsContent value="cliente" className="mt-0 animate-fade-in-up">
                                    {clientSubTab === 'contacto' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                                            {/* Tipo de lead */}
                                            <FormField
                                                control={form.control}
                                                name="leadType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Tipo de Lead *</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl border-border h-12 bg-background">
                                                                    <SelectValue placeholder="Selecciona tipo" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="B2C">B2C</SelectItem>
                                                                <SelectItem value="B2B">B2B</SelectItem>
                                                                <SelectItem value="B2B2C">B2B2C</SelectItem>
                                                                <SelectItem value="Rent Partner">Rent Partner</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Fira */}
                                            <FormField
                                                control={form.control}
                                                name="fair"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Feria</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl border-border h-12 bg-background">
                                                                    <SelectValue placeholder="Selecciona fira (opcional)" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Alacant">Alacant</SelectItem>
                                                                <SelectItem value="Múrcia">Múrcia</SelectItem>
                                                                <SelectItem value="Jerez">Jerez</SelectItem>
                                                                <SelectItem value="Bilbao">Bilbao</SelectItem>
                                                                <SelectItem value="Madrid">Madrid</SelectItem>
                                                                <SelectItem value="Düsseldorf">Düsseldorf</SelectItem>
                                                                <SelectItem value="Barcelona">Barcelona</SelectItem>
                                                                <SelectItem value="Zamora">Zamora</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Nombre */}
                                            <FormField
                                                control={form.control}
                                                name="clientName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Nombre *</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Apellidos */}
                                            <FormField
                                                control={form.control}
                                                name="clientSurname"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Apellidos *</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Teléfono */}
                                            <FormField
                                                control={form.control}
                                                name="clientPhone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Teléfono *</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input {...field} className="pl-10 rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Email */}
                                            <FormField
                                                control={form.control}
                                                name="clientEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Email *</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input type="email" {...field} className="pl-10 rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* DNI / CIF */}
                                            <FormField
                                                control={form.control}
                                                name="clientDni"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">DNI / CIF</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Data de naixement */}
                                            <FormField
                                                control={form.control}
                                                name="clientBirthDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Data de Naixement</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input type="date" {...field} className="pl-10 rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Comercial assignat */}
                                            <FormField
                                                control={form.control}
                                                name="comercial"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Comercial Assignat *</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl border-border h-12 bg-background">
                                                                    <SelectValue placeholder="Selecciona comercial" />
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

                                            {/* País */}
                                            <FormField
                                                control={form.control}
                                                name="country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">País *</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Ej: España" className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Comunidad autónoma */}
                                            <FormField
                                                control={form.control}
                                                name="autonomousCommunity"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Comunidad Autónoma *</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Ej: Catalunya" className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Ciudad */}
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Ciudad</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Dirección cliente */}
                                            <FormField
                                                control={form.control}
                                                name="clientAddress"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Dirección Cliente</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Número (puerta/piso) */}
                                            <FormField
                                                control={form.control}
                                                name="addressNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Número (puerta/piso)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Ej: 3-2ª" className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                    {clientSubTab === 'facturacion' && (
                                        <div className="animate-fade-in-up">
                                            <BillingInfoForm form={form} disabled={isLoading} />
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="presupuesto" className="mt-0 animate-fade-in-up">
                                    <BudgetListTab projectId={lead?.client_id || lead?._raw?.id || lead?.id} clientName={lead?.name} />
                                </TabsContent>

                                <TabsContent value="contratos" className="mt-0 animate-fade-in-up">
                                    <ContractsTab projectId={currentProjectId} leadStatus={lead?.status} onContractFormOpen={setIsContractFormOpen} />
                                </TabsContent>
                            </div>
                        </Tabs>

                        <div className="flex justify-end space-x-3 p-6 bg-muted/20 border-t border-border rounded-b-2xl shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                Cerrar
                            </Button>
                            <Button
                                type="button"
                                onClick={form.handleSubmit(onSubmit, onInvalid)}
                                disabled={isLoading || isContractFormOpen}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar Cambios'
                                )}
                            </Button>
                        </div>
                    </div>
                </Form>
            </DialogContent>


        </Dialog>
    );
};

export default LeadDetailModal;
