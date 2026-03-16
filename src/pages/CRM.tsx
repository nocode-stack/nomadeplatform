
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    Users,
    Search,
    Plus,
    MoreVertical,
    Mail,
    Euro,
    FileText,
    Filter,
    X,
    Loader2,
    Trash2,
    CalendarDays
} from 'lucide-react';
import AnimatedFlame from '../components/ui/AnimatedFlame';
import { useNavigate } from 'react-router-dom';
import NewLeadModal from '../components/crm/NewLeadModal';
import LeadDetailModal from '../components/crm/LeadDetailModal';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { useClients, useDeleteLead, useToggleHotLead } from '../hooks/useClients';

interface CRMLead {
    id: string;
    client_id: string;
    name: string;
    surname: string;
    company: string;
    status: string;
    email: string;
    phone: string;
    dni: string;
    birthDate: string;
    address: string;
    addressNumber: string;
    comercial: string;
    leadType: string;
    fair: string;
    country: string;
    autonomousCommunity: string;
    city: string;
    isHotLead: boolean;
    vehicleModel: string;
    motorization: string;
    furnitureColor: string;
    exteriorColor: string;
    productionSlot: string;
    electricalSystem: string;
    extraPacks: string;
    projectNotes: string;
    budgetNotes: string;
    discount: string;
    discountAmount: string;
    reservationAmount: string;
    items: unknown[];
    budgetId?: string;
    hasBudgets: boolean;
    hasContracts: boolean;
    billingType: string;
    clientBillingName: string;
    clientBillingEmail: string;
    clientBillingPhone: string;
    clientBillingAddress: string;
    clientBillingCompanyName: string;
    clientBillingCompanyCif: string;
    clientBillingCompanyPhone: string;
    clientBillingCompanyEmail: string;
    clientBillingCompanyAddress: string;
    createdAt: string;
    _raw: unknown;
}

const CRM = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
    const [localSearch, setLocalSearch] = useState('');
    const [selectedComerciales, setSelectedComerciales] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [filterHotLead, setFilterHotLead] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<CRMLead | null>(null);

    const { data: clientsData, isLoading, error } = useClients();
    const deleteLeadMutation = useDeleteLead();

    const handleDeleteClick = (e: React.MouseEvent, lead: CRMLead) => {
        e.stopPropagation();
        setLeadToDelete(lead);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (leadToDelete) {
            await deleteLeadMutation.mutateAsync(leadToDelete.client_id);
            setIsDeleteDialogOpen(false);
            setLeadToDelete(null);
        }
    };

    // Map Supabase data to the structure the CRM expects
    const leads = (clientsData || []).map(client => {
        try {
            const budgets = (client as Record<string, unknown>).budget as Record<string, unknown>[] || [];
            const contracts = (client as Record<string, unknown>).contracts as Record<string, unknown>[] || [];
            const primaryBudget = budgets.find((b: Record<string, unknown>) => b.is_primary) || budgets[0] as Record<string, unknown> | undefined;
            const billing = client.billing?.[0];

            return {
                id: client.id,
                client_id: client.id,
                name: client.name || 'Sin nombre',
                surname: client.surname || '',
                company: billing?.name || 'Empresa no definida',
                status: client.client_status || 'prospect',
                email: client.email || '',
                phone: client.phone || '',
                dni: client.dni || '',
                birthDate: client.birthdate || '',
                address: client.address || '',
                addressNumber: client.address_number || '',
                comercial: client.comercial || '',
                leadType: client.lead_type || '',
                fair: client.fair || '',
                country: client.country || '',
                autonomousCommunity: client.autonomous_community || '',
                city: client.city || '',
                isHotLead: (client as Record<string, unknown>).is_hot_lead as boolean || false,
                vehicleModel: (primaryBudget as Record<string, unknown> | undefined)?.model_option ? ((primaryBudget as Record<string, unknown>).model_option as Record<string, unknown>)?.name as string || '' : '',
                motorization: (primaryBudget as Record<string, unknown> | undefined)?.engine_option ? ((primaryBudget as Record<string, unknown>).engine_option as Record<string, unknown>)?.name as string || '' : '',
                furnitureColor: (primaryBudget as Record<string, unknown> | undefined)?.interior_color_option ? ((primaryBudget as Record<string, unknown>).interior_color_option as Record<string, unknown>)?.name as string || '' : '',
                exteriorColor: '',
                productionSlot: 'Por asignar',
                electricalSystem: (primaryBudget as Record<string, unknown> | undefined)?.electric_system ? ((primaryBudget as Record<string, unknown>).electric_system as Record<string, unknown>)?.name as string || '' : '',
                extraPacks: (primaryBudget as Record<string, unknown> | undefined)?.pack ? ((primaryBudget as Record<string, unknown>).pack as Record<string, unknown>)?.name as string || '' : '',
                projectNotes: (primaryBudget as Record<string, unknown> | undefined)?.comments as string || (primaryBudget as Record<string, unknown> | undefined)?.notes as string || '',
                budgetNotes: (primaryBudget as Record<string, unknown> | undefined)?.comments as string || (primaryBudget as Record<string, unknown> | undefined)?.notes as string || '',
                discount: ((primaryBudget as Record<string, unknown> | undefined)?.discount_percentage as number * 100)?.toString() || '0',
                discountAmount: ((primaryBudget as Record<string, unknown> | undefined)?.discount_amount as number)?.toString() || '0',
                reservationAmount: ((primaryBudget as Record<string, unknown> | undefined)?.reservation_amount as number)?.toString() || ((primaryBudget as Record<string, unknown> | undefined)?.reservation_price as number)?.toString() || '1500',
                items: (primaryBudget as Record<string, unknown> | undefined)?.budget_items as unknown[] || [],
                budgetId: primaryBudget?.id,
                hasBudgets: budgets.length > 0,
                hasContracts: contracts.length > 0,
                billingType: billing?.type || 'personal',
                clientBillingName: billing?.name || '',
                clientBillingEmail: billing?.email || '',
                clientBillingPhone: billing?.phone || '',
                clientBillingAddress: billing?.billing_address || '',
                clientBillingCompanyName: billing?.name || '',
                clientBillingCompanyCif: billing?.nif || '',
                clientBillingCompanyPhone: billing?.phone || '',
                clientBillingCompanyEmail: billing?.email || '',
                clientBillingCompanyAddress: billing?.billing_address || '',
                createdAt: client.created_at || '',
                _raw: client
            };
        } catch (e) {
            console.error('❌ Error mapping client in CRM:', client, e);
            return null;
        }
    }).filter(Boolean) as CRMLead[];

    const comerciales = Array.from(new Set(leads.map(l => l.comercial).filter(Boolean)));
    const models = Array.from(new Set(leads.map(l => l.vehicleModel).filter(Boolean)));
    const statuses = [
        { id: 'prospect', label: 'Prospect' },
        { id: 'client', label: 'Cliente' }
    ];

    const toggleComercial = (name: string) => {
        setSelectedComerciales(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const toggleStatus = (id: string) => {
        setSelectedStatuses(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleModel = (name: string) => {
        setSelectedModels(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const resetFilters = () => {
        setSelectedComerciales([]);
        setSelectedStatuses([]);
        setSelectedModels([]);
        setFilterHotLead(false);
        setDateFrom('');
        setDateTo('');
        setLocalSearch('');
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return '-';
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(localSearch.toLowerCase()) ||
            lead.company.toLowerCase().includes(localSearch.toLowerCase()) ||
            lead.email.toLowerCase().includes(localSearch.toLowerCase());
        const matchesComercial = selectedComerciales.length === 0 || selectedComerciales.includes(lead.comercial);
        const matchesStatus = selectedStatuses.length === 0 || (lead.status && selectedStatuses.includes(lead.status));
        const matchesModel = selectedModels.length === 0 || selectedModels.includes(lead.vehicleModel);
        const matchesHotLead = !filterHotLead || lead.isHotLead;

        let matchesDate = true;
        if (dateFrom || dateTo) {
            const leadDate = lead.createdAt ? new Date(lead.createdAt) : null;
            if (!leadDate) {
                matchesDate = false;
            } else {
                if (dateFrom) {
                    const from = new Date(dateFrom);
                    from.setHours(0, 0, 0, 0);
                    if (leadDate < from) matchesDate = false;
                }
                if (dateTo) {
                    const to = new Date(dateTo);
                    to.setHours(23, 59, 59, 999);
                    if (leadDate > to) matchesDate = false;
                }
            }
        }

        return matchesSearch && matchesComercial && matchesStatus && matchesModel && matchesHotLead && matchesDate;
    });

    const isFiltered = selectedComerciales.length > 0 || selectedStatuses.length > 0 || selectedModels.length > 0 || filterHotLead || localSearch !== '' || dateFrom !== '' || dateTo !== '';

    if (isLoading) {
        return (
            <Layout title="Gestión de CRM" subtitle="Leads y Clientes de Nomade Nation">
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="Gestión de CRM" subtitle="Leads y Clientes de Nomade Nation">
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <p className="text-destructive font-bold">Error al cargar los datos</p>
                    <Button onClick={() => window.location.reload()}>Reintentar</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Gestión de CRM" subtitle="Leads y Clientes de Nomade Nation">
            <div className="space-y-6 animate-blur-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar contactos..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-1 sm:flex-none rounded-xl border-border h-10 flex items-center justify-center gap-2 bg-card hover:bg-muted/50 transition-all">
                                    <Filter className="w-4 h-4 text-muted-foreground" />
                                    <span>Filtros</span>
                                    {isFiltered && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-bold">
                                            {selectedComerciales.length + selectedStatuses.length + selectedModels.length + (filterHotLead ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0 rounded-2xl border-border shadow-2xl bg-card" align="start">
                                <div className="max-h-[70vh] overflow-y-auto p-6 custom-scrollbar">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-border pb-3">
                                            <h4 className="font-bold text-foreground flex items-center gap-2">
                                                <Filter className="w-4 h-4" />
                                                Filtros de CRM
                                            </h4>
                                            {isFiltered && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={resetFilters}
                                                    className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
                                                >
                                                    Limpiar
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Comercial</p>
                                                <div className="space-y-2">
                                                    {comerciales.map(name => (
                                                        <div key={name} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleComercial(name)}>
                                                            <Checkbox
                                                                id={`comercial-${name}`}
                                                                checked={selectedComerciales.includes(name)}
                                                                className="rounded focus:ring-primary/20"
                                                            />
                                                            <Label
                                                                htmlFor={`comercial-${name}`}
                                                                className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Estado</p>
                                                <div className="space-y-2">
                                                    {statuses.map(status => (
                                                        <div key={status.id} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleStatus(status.id)}>
                                                            <Checkbox
                                                                id={`status-${status.id}`}
                                                                checked={selectedStatuses.includes(status.id)}
                                                                className="rounded focus:ring-primary/20"
                                                            />
                                                            <Label
                                                                htmlFor={`status-${status.id}`}
                                                                className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {status.label}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Modelo</p>
                                                <div className="space-y-2">
                                                    {models.map(model => (
                                                        <div key={model} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleModel(model)}>
                                                            <Checkbox
                                                                id={`model-${model}`}
                                                                checked={selectedModels.includes(model)}
                                                                className="rounded focus:ring-primary/20"
                                                            />
                                                            <Label
                                                                htmlFor={`model-${model}`}
                                                                className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {model}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Hot Lead</p>
                                                <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setFilterHotLead(!filterHotLead)}>
                                                    <Checkbox
                                                        id="filter-hot-lead"
                                                        checked={filterHotLead}
                                                        className="rounded focus:ring-primary/20"
                                                    />
                                                    <Label
                                                        htmlFor="filter-hot-lead"
                                                        className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <AnimatedFlame size="sm" active={true} />
                                                        Solo Hot Leads
                                                    </Label>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                    Fecha de Creación
                                                </p>
                                                <div className="space-y-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-muted-foreground">Desde</label>
                                                        <input
                                                            type="date"
                                                            value={dateFrom}
                                                            onChange={(e) => setDateFrom(e.target.value)}
                                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                                                        <input
                                                            type="date"
                                                            value={dateTo}
                                                            onChange={(e) => setDateTo(e.target.value)}
                                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {isFiltered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-10 px-4 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/20 rounded-xl"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Limpiar
                            </Button>
                        )}
                        <Button
                            className="flex-1 sm:flex-none justify-center rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 animate-pulse-subtle"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Lead
                        </Button>
                    </div>
                </div>

                <NewLeadModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onLeadCreated={(newLeadData) => {
                        // Refetch the clients list, then open the detail modal for the new lead
                        queryClient.invalidateQueries({ queryKey: ['common-clients-list'] }).then(() => {
                            // Small delay to let the query refetch complete
                            setTimeout(() => {
                                const freshLeads = queryClient.getQueryData<any[]>(['common-clients-list']);
                                if (freshLeads) {
                                    const newClientId = newLeadData?.client_id;
                                    const matchingClient = freshLeads.find((c: Record<string, unknown>) => c.id === newClientId);
                                    if (matchingClient) {
                                        // Build the lead object just like the leads mapping does
                                        const budgets = matchingClient.budget || [];
                                        const contracts = matchingClient.contracts || [];
                                        const primaryBudget = budgets.find((b: Record<string, unknown>) => b.is_primary) || budgets[0];
                                        const billing = matchingClient.billing?.[0];
                                        const leadObj = {
                                            id: matchingClient.id,
                                            client_id: matchingClient.id,
                                            name: matchingClient.name || 'Sin nombre',
                                            company: billing?.name || 'Empresa no definida',
                                            status: matchingClient.client_status || 'prospect',
                                            email: matchingClient.email || '',
                                            phone: matchingClient.phone || '',
                                            dni: matchingClient.dni || '',
                                            birthDate: matchingClient.birthdate || '',
                                            address: matchingClient.address || '',
                                            addressNumber: matchingClient.address_number || '',
                                            comercial: matchingClient.comercial || '',
                                            leadType: matchingClient.lead_type || '',
                                            fair: matchingClient.fair || '',
                                            country: matchingClient.country || '',
                                            autonomousCommunity: matchingClient.autonomous_community || '',
                                            city: matchingClient.city || '',
                                            surname: matchingClient.surname || '',
                                            isHotLead: matchingClient.is_hot_lead || false,
                                            vehicleModel: primaryBudget?.model_option?.name || '',
                                            motorization: primaryBudget?.engine_option?.name || '',
                                            hasBudgets: budgets.length > 0,
                                            hasContracts: contracts.length > 0,
                                            billingType: billing?.type || 'personal',
                                            _raw: matchingClient
                                        };
                                        setSelectedLead(leadObj);
                                        setIsDetailModalOpen(true);
                                    }
                                }
                            }, 500);
                        });
                    }}
                />

                <LeadDetailModal
                    open={isDetailModalOpen}
                    onOpenChange={setIsDetailModalOpen}
                    lead={selectedLead}
                    onLeadUpdated={(updatedLead) => {
                        setSelectedLead(updatedLead);
                    }}
                />

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="rounded-2xl border-border bg-card">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                                <Trash2 className="w-5 h-5" />
                                ¿Confirmar eliminación?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground pt-2">
                                Esta acción desactivará permanentemente al cliente <b>{leadToDelete?.name}</b> y toda su información vinculada (presupuestos, contratos e ítems). Esta operación no se puede deshacer de forma sencilla.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-4">
                            <AlertDialogCancel className="rounded-xl border-border">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive hover:bg-destructive/90 text-white rounded-xl shadow-lg shadow-destructive/20"
                                disabled={deleteLeadMutation.isPending}
                            >
                                {deleteLeadMutation.isPending ? "Eliminando..." : "Sí, eliminar lead"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in-up [animation-delay:200ms]">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border backdrop-blur-md">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">Contacto</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">Comercial</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">Fecha de Creación</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">Acciones Directas</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-10 bg-muted/30"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                    <Users className="w-8 h-8 text-muted-foreground/40" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-semibold text-foreground/70">
                                                        {isFiltered ? 'No se encontraron resultados' : 'No hay leads todavía'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {isFiltered
                                                            ? 'Prueba ajustando los filtros de búsqueda'
                                                            : 'Añade tu primer lead para empezar a gestionar clientes'}
                                                    </p>
                                                </div>
                                                {!isFiltered && (
                                                    <Button
                                                        className="mt-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                                                        onClick={() => setIsModalOpen(true)}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Nuevo Lead
                                                    </Button>
                                                )}
                                                {isFiltered && (
                                                    <Button
                                                        variant="outline"
                                                        className="mt-2 rounded-xl border-border"
                                                        onClick={resetFilters}
                                                    >
                                                        Limpiar filtros
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredLeads.map((lead, idx) => (
                                    <tr
                                        key={lead.id}
                                        className="hover:bg-muted/30 transition-colors group cursor-pointer animate-fade-in-up"
                                        style={{ animationDelay: `${200 + (idx * 30)}ms` }}
                                        onClick={() => {
                                            setSelectedLead(lead);
                                            setIsDetailModalOpen(true);
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {lead.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                                    {lead.name}
                                                    {lead.isHotLead && (
                                                        <AnimatedFlame size="sm" active={true} data-testid="hot-lead-icon" />
                                                    )}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-foreground font-medium">
                                                <div className="w-2 h-2 rounded-full bg-primary/40 mr-2" />
                                                {lead.comercial || 'No asignado'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                <span className="font-medium tabular-nums">{formatDate(lead.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`rounded-full px-3 py-0.5 border font-bold text-[10px] uppercase tracking-wide ${lead.status === 'client'
                                                ? 'bg-success/10 text-success border-success/20'
                                                : 'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                {lead.status === 'client' ? 'Cliente' : 'Prospect'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    className={`p-2 rounded-lg transition-all tooltip ${lead.hasBudgets
                                                        ? 'bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white cursor-pointer'
                                                        : 'bg-muted/20 text-muted-foreground/30 cursor-not-allowed'
                                                        }`}
                                                    title={lead.hasBudgets ? 'Ver Presupuestos' : 'Sin presupuestos'}
                                                    disabled={!lead.hasBudgets}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (lead.hasBudgets) {
                                                            navigate(`/presupuestos?search=${lead.name}`);
                                                        }
                                                    }}
                                                >
                                                    <Euro className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className={`p-2 rounded-lg transition-all tooltip ${lead.hasContracts
                                                        ? 'bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white cursor-pointer'
                                                        : 'bg-muted/20 text-muted-foreground/30 cursor-not-allowed'
                                                        }`}
                                                    title={lead.hasContracts ? 'Ver Contratos' : 'Sin contratos'}
                                                    disabled={!lead.hasContracts}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (lead.hasContracts) {
                                                            navigate(`/contratos?search=${lead.name}`);
                                                        }
                                                    }}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all tooltip"
                                                    title="Enviar Email"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.location.href = `mailto:${lead.email}`;
                                                    }}
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground/60 hover:text-foreground"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-border bg-card shadow-2xl">
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2 p-3 text-sm font-medium rounded-lg cursor-pointer hover:bg-muted transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLead(lead);
                                                            setIsDetailModalOpen(true);
                                                        }}
                                                    >
                                                        <Users className="w-4 h-4" />
                                                        Ver detalle
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-border my-1" />
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2 p-3 text-sm font-medium rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                        onClick={(e) => handleDeleteClick(e, lead)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Eliminar Lead
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CRM;
