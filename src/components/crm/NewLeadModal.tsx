
import React, { useState } from 'react';
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
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Loader2, User, FileText, Mail, Phone, Calendar, UserPlus, Wallet, Flame } from 'lucide-react';
import BillingInfoForm from '../projects/BillingInfoForm';
import BudgetListTab from './BudgetListTab';
import ContractsTab from './ContractsTab';
import { useProjects } from '../../hooks/useNewProjects';
import { useToast } from '@/hooks/use-toast';

const newLeadSchema = z.object({
    // Información del Cliente
    clientName: z.string().min(1, 'El nombre es obligatorio'),
    clientLastName: z.string().optional(),
    clientPhone: z.string().min(1, 'El teléfono es obligatorio'),
    clientEmail: z.string().email('Email válido requerido'),
    clientDni: z.string().optional(),
    clientBirthDate: z.string().optional(),
    clientAddress: z.string().optional(),
    comercial: z.string().optional(),

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
    clientBillingEmail: z.string().optional(),
    clientBillingPhone: z.string().optional(),
    clientBillingAddress: z.string().optional(),
    otherPersonName: z.string().optional(),
    otherPersonEmail: z.string().optional(),
    otherPersonPhone: z.string().optional(),
    otherPersonAddress: z.string().optional(),
    otherPersonDni: z.string().optional(),
    clientBillingCompanyName: z.string().optional(),
    clientBillingCompanyCif: z.string().optional(),
    clientBillingCompanyPhone: z.string().optional(),
    clientBillingCompanyEmail: z.string().optional(),
    clientBillingCompanyAddress: z.string().optional(),
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

type NewLeadFormData = z.infer<typeof newLeadSchema>;

interface NewLeadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLeadCreated?: (leadData: any) => void;
}

const NewLeadModal = ({ open, onOpenChange, onLeadCreated }: NewLeadModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('cliente');
    const [clientSubTab, setClientSubTab] = useState<'contacto' | 'facturacion'>('contacto');
    const [isHotLead, setIsHotLead] = useState(false);

    const { createProject } = useProjects();
    const { toast } = useToast();

    const form = useForm<NewLeadFormData>({
        resolver: zodResolver(newLeadSchema),
        defaultValues: {
            clientName: '',
            clientLastName: '',
            clientPhone: '',
            clientEmail: '',
            clientDni: '',
            clientBirthDate: '',
            clientAddress: '',
            comercial: '',
            vehicleModel: '',
            motorization: '',
            furnitureColor: '',
            exteriorColor: '',
            productionSlot: '',
            electricalSystem: '',
            extraPacks: 'Pack Nomade',
            projectNotes: '',
            billingType: 'personal',
            discount: '0',
            budgetNotes: '',
            items: [],
        },
    });

    const onSubmit = async (data: NewLeadFormData) => {
        if (import.meta.env.DEV) console.log('✅ Form submission valid, saving lead:', data);
        setIsLoading(true);
        try {
            const adaptedData = {
                ...data,
                clientType: 'prospect',
                isHotLead,
            };

            const newProject = await createProject(adaptedData, 'save_only');

            if (newProject) {
                setCreatedProjectId(newProject.id);
            }

            toast({
                title: "Lead registrado",
                description: "El lead se ha guardado correctamente.",
            });

            if (onLeadCreated) onLeadCreated(adaptedData);
            onOpenChange(false);
            form.reset();
            setCreatedProjectId(null);
            setIsHotLead(false);
        } catch (error: any) {
            console.error('❌ Error creating lead:', error);
            toast({
                title: "Error",
                description: error.message || "No se pudo registrar el lead.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl h-[90vh] flex flex-col p-0 border-none shadow-2xl rounded-2xl bg-card text-foreground animate-scale-in">
                <div className="bg-muted/30 border-b border-border p-6 rounded-t-2xl shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground flex items-center">
                            <div className="p-2 bg-primary rounded-lg text-primary-foreground mr-3 shadow-lg shadow-primary/20">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            Nuevo Lead
                            <Badge className="ml-4 rounded-full px-3 py-0.5 border font-bold text-[10px] uppercase tracking-wide bg-primary/10 text-primary border-primary/20">
                                Prospect
                            </Badge>
                            {/* Hot Lead Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsHotLead(!isHotLead)}
                                className={`ml-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${isHotLead
                                    ? 'bg-orange-500/15 text-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.5)] ring-1 ring-orange-400/30'
                                    : 'bg-muted/50 text-muted-foreground/60 hover:text-orange-400 hover:bg-orange-500/10 hover:ring-1 hover:ring-orange-300/20'
                                    }`}
                                title={isHotLead ? 'Desactivar Hot Lead' : 'Activar Hot Lead'}
                            >
                                <Flame className={`w-3.5 h-3.5 transition-all duration-300 ${isHotLead ? 'text-orange-500 animate-pulse' : ''}`} />
                                <span className="text-[10px] tracking-wider uppercase">Hot Lead</span>
                            </button>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1">
                            Introduce la información necesaria para registrar un nuevo cliente potencial.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
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

                            {/* Sub-tabs para Información Cliente */}
                            {activeTab === 'cliente' && (
                                <div className="px-6 bg-card border-b border-border shrink-0">
                                    <div className="flex w-full">
                                        <button
                                            type="button"
                                            onClick={() => setClientSubTab('contacto')}
                                            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${clientSubTab === 'contacto'
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                                }`}
                                        >
                                            <User className="h-4 w-4" />
                                            Información de Contacto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setClientSubTab('facturacion')}
                                            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${clientSubTab === 'facturacion'
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                                }`}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Información de Facturación
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-8 bg-card custom-scrollbar">
                                <TabsContent value="cliente" className="mt-0 animate-fade-in-up">
                                    {clientSubTab === 'contacto' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                                            <FormField
                                                control={form.control}
                                                name="clientName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Nombre Completo *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Nombre del cliente" {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
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
                                                        <FormLabel className="text-foreground font-bold">Teléfono *</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input placeholder="Teléfono de contacto" {...field} className="pl-10 rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                            </div>
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
                                                        <FormLabel className="text-foreground font-bold">Email *</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                <Input type="email" placeholder="Email del cliente" {...field} className="pl-10 rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
                                                            </div>
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
                                                        <FormLabel className="text-foreground font-bold">DNI / CIF</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="DNI del cliente" {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
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
                                                        <FormLabel className="text-foreground font-bold">Fecha de Nacimiento</FormLabel>
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

                                            <FormField
                                                control={form.control}
                                                name="comercial"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground font-bold">Comercial Responsable</FormLabel>
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

                                            <FormField
                                                control={form.control}
                                                name="clientAddress"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel className="text-foreground font-bold">Dirección de Envío</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Dirección completa del cliente" {...field} className="rounded-xl border-border h-12 focus:ring-primary/10 focus:border-primary bg-background" />
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
                                    <BudgetListTab projectId={createdProjectId || undefined} clientName={form.watch('clientName') || undefined} />
                                </TabsContent>

                                <TabsContent value="contratos" className="mt-0 animate-fade-in-up">
                                    <ContractsTab projectId={createdProjectId || undefined} />
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
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    'Registrar Lead'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>

        </Dialog>
    );
};

export default NewLeadModal;
