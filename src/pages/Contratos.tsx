import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
    Plus,
    ExternalLink,
    ShieldCheck,
    History,
    FileSignature,
    Search,
    Filter,
    X,
    Send,
    Star,
    Handshake,
    Bookmark,
    FileCheck,
    FileText,
    Loader2
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { useAllContracts } from '../hooks/useAllContracts';
import { useToggleContractPrimary } from '../hooks/useToggleContractPrimary';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Contratos = () => {
    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get('search')?.toLowerCase() || '';

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [onlyCurrent, setOnlyCurrent] = useState(false);
    const [localSearch, setLocalSearch] = useState(searchTerm);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const { data: rawContracts, isLoading } = useAllContracts();
    const togglePrimary = useToggleContractPrimary();

    const mapContractType = (type: string) => {
        switch (type) {
            case 'reservation': return 'Contrato Reserva';
            case 'purchase_agreement': return 'Acuerdo Compraventa';
            case 'sale_contract': return 'Contrato Compraventa';
            default: return type;
        }
    };

    const mapContractStatus = (status: string) => {
        switch (status) {
            case 'editing':
            case 'generated':
            case 'por_crear':
                return 'pending_send';
            case 'sent':
                return 'awaiting_signature';
            case 'signed':
                return 'completed';
            default:
                return status;
        }
    };

    const allContracts = (rawContracts || []).map(c => ({
        id: c.id.substring(0, 8).toUpperCase(),
        realId: c.id,
        projectId: c.client_id, // Usar client_id ahora para acciones
        contractType: c.contract_type,
        client: c.client_full_name || c.client?.name || 'Sin nombre',
        status: mapContractStatus(c.estado_visual),
        date: (c.updated_at || c.created_at) ? format(new Date(c.updated_at || c.created_at), 'dd/MM/yyyy', { locale: es }) : 'N/A',
        budgetCode: c.budget?.budget_code || 'Presupuesto no asignado',
        type: mapContractType(c.contract_type),
        isPrimary: c.is_primary || false,
        isCurrent: c.is_latest,
        model: c.vehicle_model || 'N/A'
    }));

    const types = ['Contrato Reserva', 'Acuerdo Compraventa', 'Contrato Compraventa'];
    const models = Array.from(new Set(allContracts.map(c => c.model))).filter(Boolean);
    const statuses = [
        { id: 'pending_send', label: 'Pendiente de envío' },
        { id: 'awaiting_signature', label: 'Pendiente de firma' },
        { id: 'completed', label: 'Firmado' }
    ];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Contrato Reserva':
                return <Bookmark className="w-5 h-5" />;
            case 'Acuerdo Compraventa':
                return <Handshake className="w-5 h-5" />;
            case 'Contrato Compraventa':
                return <FileCheck className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getTypeColors = (type: string) => {
        switch (type) {
            case 'Contrato Reserva':
                return 'bg-blue-100/50 text-blue-600';
            case 'Acuerdo Compraventa':
                return 'bg-amber-100/50 text-amber-600';
            case 'Contrato Compraventa':
                return 'bg-emerald-100/50 text-emerald-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
        setCurrentPage(1);
    };

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
        setCurrentPage(1);
    };

    const toggleModel = (model: string) => {
        setSelectedModels(prev =>
            prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
        );
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setSelectedTypes([]);
        setSelectedStatuses([]);
        setSelectedModels([]);
        setOnlyCurrent(false);
        setLocalSearch('');
        setCurrentPage(1);
    };

    const filteredContracts = allContracts.filter(c => {
        const matchesSearch = c.client.toLowerCase().includes(localSearch.toLowerCase()) ||
            c.id.toLowerCase().includes(localSearch.toLowerCase()) ||
            c.budgetCode.toLowerCase().includes(localSearch.toLowerCase());
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(c.type);
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(c.status);
        const matchesCurrent = !onlyCurrent || c.isCurrent;
        const matchesModel = selectedModels.length === 0 || selectedModels.includes(c.model);
        return matchesSearch && matchesType && matchesStatus && matchesCurrent && matchesModel;
    });

    const isFiltered = selectedTypes.length > 0 || selectedStatuses.length > 0 || selectedModels.length > 0 || onlyCurrent || localSearch !== '';

    const totalPages = Math.ceil(filteredContracts.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedContracts = filteredContracts.slice(startIndex, startIndex + pageSize);

    if (isLoading) {
        return (
            <Layout title="Contratos" subtitle="Gestión y firma digital de contratos con DocuSign">
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">Cargando contratos...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Contratos" subtitle="Gestión y firma digital de contratos con DocuSign">
            <div className="space-y-8 animate-blur-in">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 rounded-2xl bg-card border-border shadow-sm flex items-center space-x-4 animate-fade-in-up [animation-delay:100ms]">
                        <div className="p-3 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20 animate-pulse-subtle" style={{ animationDelay: '0.2s' }}>
                            <FileSignature className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{allContracts.length}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Contratos</p>
                        </div>
                    </Card>

                    <Card className="p-6 rounded-2xl bg-card border-border shadow-sm flex items-center space-x-4 animate-fade-in-up [animation-delay:200ms]">
                        <div className="p-3 bg-warning rounded-xl text-warning-foreground shadow-lg shadow-warning/20 animate-pulse-subtle" style={{ animationDelay: '1.5s' }}>
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{allContracts.filter(c => c.status !== 'completed').length}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Pendientes</p>
                        </div>
                    </Card>

                    <Card className="p-6 rounded-2xl bg-card border-border shadow-sm flex items-center space-x-4 animate-fade-in-up [animation-delay:300ms]">
                        <div className="p-3 bg-success rounded-xl text-success-foreground shadow-lg shadow-success/20 animate-pulse-subtle" style={{ animationDelay: '0.8s' }}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{allContracts.filter(c => c.status === 'completed').length}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Firmados</p>
                        </div>
                    </Card>
                </div>

                {/* Search and Filters Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up [animation-delay:400ms]">
                    <div className="flex flex-1 items-center gap-3 w-full">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por cliente o ID..."
                                value={localSearch}
                                onChange={(e) => {
                                    setLocalSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm text-foreground"
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="rounded-xl border-border h-11 flex items-center gap-2 bg-card hover:bg-muted/50 transition-all">
                                    <Filter className="w-4 h-4 text-muted-foreground" />
                                    <span>Filtros</span>
                                    {isFiltered && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-bold">
                                            {selectedTypes.length + selectedStatuses.length + selectedModels.length + (onlyCurrent ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-6 rounded-2xl border-border shadow-2xl bg-card" align="start">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-border pb-3">
                                        <h4 className="font-bold text-foreground flex items-center gap-2">
                                            <Filter className="w-4 h-4" />
                                            Filtros Avanzados
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
                                        <div className="pb-2 border-b border-border/50">
                                            <div
                                                className="flex items-center space-x-3 group cursor-pointer"
                                                onClick={() => {
                                                    setOnlyCurrent(!onlyCurrent);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <Checkbox
                                                    id="only-current"
                                                    checked={onlyCurrent}
                                                    className="rounded focus:ring-primary/20"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Star className={`w-4 h-4 animate-pulse-star ${onlyCurrent ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                                                    <Label
                                                        htmlFor="only-current"
                                                        className="text-sm font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                                    >
                                                        Solo actuales
                                                    </Label>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Tipo de Contrato</p>
                                            <div className="space-y-2">
                                                {types.map(type => (
                                                    <div key={type} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleType(type)}>
                                                        <Checkbox
                                                            id={`type-${type}`}
                                                            checked={selectedTypes.includes(type)}
                                                            className="rounded focus:ring-primary/20"
                                                        />
                                                        <Label
                                                            htmlFor={`type-${type}`}
                                                            className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                                        >
                                                            {type}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Estado del Documento</p>
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
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Modelo de Vehículo</p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
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
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {isFiltered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-11 px-4 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/20"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                </div>

                {/* Contract List (Flattened) */}
                <div className="animate-fade-in-up [animation-delay:500ms]">
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="divide-y divide-border/50">
                            {paginatedContracts.length > 0 ? paginatedContracts.map((c) => (
                                <div key={c.realId} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-center space-x-5">
                                        <div className={`p-3 rounded-xl ${getTypeColors(c.type)}`}>
                                            {getTypeIcon(c.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-bold text-foreground">{c.client}</h4>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePrimary.mutate({
                                                            contractId: c.realId,
                                                            projectId: c.projectId,
                                                            contractType: c.contractType,
                                                            isPrimary: !c.isPrimary,
                                                        });
                                                    }}
                                                    disabled={togglePrimary.isPending}
                                                    className="p-0.5 rounded-md hover:bg-amber-50 transition-all hover:scale-110"
                                                    title={c.isPrimary ? 'Quitar como principal' : 'Marcar como principal'}
                                                >
                                                    <Star className={`w-3.5 h-3.5 transition-all ${c.isPrimary ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                <span className="text-foreground/70">{c.type}</span> • {c.id} • Relacionado con {c.budgetCode}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-8">
                                        <div className="hidden md:block text-right">
                                            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mb-1">Última actualización</p>
                                            <p className="text-xs font-bold text-foreground/80">{c.date}</p>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${c.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                                                c.status === 'pending_send' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-warning/10 text-warning border-warning/20'
                                                }`}>
                                                {c.status === 'completed' ? 'FIRMADO' :
                                                    c.status === 'pending_send' ? 'PENDIENTE ENVÍO' :
                                                        'ESPERANDO FIRMA'}
                                            </span>
                                            <button
                                                disabled
                                                className="p-2.5 rounded-xl border border-border text-muted-foreground/40 cursor-not-allowed opacity-50 shadow-sm"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-20 text-center">
                                    <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">No se han encontrado contratos que coincidan con la búsqueda.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/5">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Mostrando {startIndex + 1} - {Math.min(startIndex + pageSize, filteredContracts.length)} de {filteredContracts.length} contratos
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 rounded-lg"
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-8 w-8 rounded-lg p-0 text-xs ${currentPage === page ? "font-bold shadow-sm" : "hover:bg-muted"}`}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 rounded-lg"
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Contratos;
