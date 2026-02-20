
import React, { useState } from 'react';
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
    Flame
} from 'lucide-react';
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

const CRM = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [localSearch, setLocalSearch] = useState('');
    const [selectedComerciales, setSelectedComerciales] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [filterHotLead, setFilterHotLead] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<any>(null);

    const { data: clientsData, isLoading, error } = useClients();
    const deleteLeadMutation = useDeleteLead();

    const handleDeleteClick = (e: React.MouseEvent, lead: any) => {
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
            const budgets = (client as any).NEW_Budget || [];
            const primaryBudget = budgets.find((b: any) => b.is_primary) || budgets[0];
            const billing = client.NEW_Billing?.[0];

            return {
                id: client.id,
                client_id: client.id,
                name: client.name || 'Sin nombre',
                company: billing?.name || 'Empresa no definida',
                status: client.client_status || 'prospect',
                email: client.email || '',
                phone: client.phone || '',
                dni: client.dni || '',
                birthDate: client.birthdate || '',
                address: client.address || '',
                comercial: 'No asignado',
                isHotLead: (client as any).is_hot_lead || false,
                vehicleModel: primaryBudget?.model_option?.name || '',
                motorization: primaryBudget?.engine_option?.name || '',
                furnitureColor: primaryBudget?.interior_color_option?.name || '',
                exteriorColor: '',
                productionSlot: 'Por asignar',
                electricalSystem: primaryBudget?.electric_system?.name || '',
                extraPacks: (primaryBudget as any)?.pack?.name || '',
                projectNotes: (primaryBudget as any)?.comments || (primaryBudget as any)?.notes || '',
                budgetNotes: (primaryBudget as any)?.comments || (primaryBudget as any)?.notes || '',
                discount: ((primaryBudget as any)?.discount_percentage * 100)?.toString() || '0',
                discountAmount: (primaryBudget as any)?.discount_amount?.toString() || '0',
                reservationAmount: (primaryBudget as any)?.reservation_amount?.toString() || (primaryBudget as any)?.reservation_price?.toString() || '1500',
                items: (primaryBudget as any)?.NEW_Budget_Items || [],
                budgetId: primaryBudget?.id,
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
                _raw: client
            };
        } catch (e) {
            console.error('❌ Error mapping client in CRM:', client, e);
            return null;
        }
    }).filter(Boolean) as any[];

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
        setLocalSearch('');
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(localSearch.toLowerCase()) ||
            lead.company.toLowerCase().includes(localSearch.toLowerCase()) ||
            lead.email.toLowerCase().includes(localSearch.toLowerCase());
        const matchesComercial = selectedComerciales.length === 0 || selectedComerciales.includes(lead.comercial);
        const matchesStatus = selectedStatuses.length === 0 || (lead.status && selectedStatuses.includes(lead.status));
        const matchesModel = selectedModels.length === 0 || selectedModels.includes(lead.vehicleModel);
        const matchesHotLead = !filterHotLead || lead.isHotLead;
        return matchesSearch && matchesComercial && matchesStatus && matchesModel && matchesHotLead;
    });

    const isFiltered = selectedComerciales.length > 0 || selectedStatuses.length > 0 || selectedModels.length > 0 || filterHotLead || localSearch !== '';

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
                                            {selectedComerciales.length + selectedStatuses.length + selectedModels.length + (filterHotLead ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-6 rounded-2xl border-border shadow-2xl bg-card" align="start">
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
                                                    <Flame className="w-4 h-4 text-orange-500" />
                                                    Solo Hot Leads
                                                </Label>
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
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">Acciones Directas</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-10 bg-muted/30"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
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
                                                        <Flame className="w-4 h-4 text-orange-500 shrink-0" data-testid="hot-lead-icon" />
                                                    )}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-foreground font-medium">
                                                <div className="w-2 h-2 rounded-full bg-primary/40 mr-2" />
                                                {lead.comercial}
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
                                                    className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all tooltip"
                                                    title="Ver Presupuestos"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/presupuestos?search=${lead.name}`);
                                                    }}
                                                >
                                                    <Euro className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-all tooltip"
                                                    title="Ver Contratos"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/contratos?search=${lead.name}`);
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
