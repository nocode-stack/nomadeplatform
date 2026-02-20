
import React, { useState, useMemo, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
    FileText,
    Search,
    Eye,
    Star,
    Loader2,
    Pencil
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useNewBudgets, useNewBudgetItems } from '../hooks/useNewBudgets';
import BudgetPrintView from '../components/crm/BudgetPrintView';
import BudgetEditorModal from '../components/crm/BudgetEditorModal';
import type { BudgetPrintData, LineItem } from '../components/crm/BudgetPrintView';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { JoinedNewBudget } from '@/types/budgets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Pack Components ────────────────────────────────────────
const PACK_COMPONENTS: Record<string, string[]> = {
    'Essentials': [
        'Escalón eléctrico', 'Mosquitera corredera lateral', 'Claraboya panorámica',
        'Sistema de gas GLP', 'Monocontrol',
    ],
    'Adventure': [
        'Pack Essentials', 'Ducha exterior', 'Toldo',
        'Sistema de Litio (100Ah)', 'Pack cine: proyector + pantalla + altavoces JBL',
    ],
    'Ultimate': [
        'Pack Essentials', 'Pack Adventure',
        'Raintec (luz exterior)', 'Llantas', 'Revestimiento de ducha',
        'Acabado de cristal en ventanas traseras',
    ],
};

const getPackComponents = (packName: string): string[] => {
    const key = Object.keys(PACK_COMPONENTS).find(k =>
        packName.toLowerCase().includes(k.toLowerCase())
    );
    return key ? PACK_COMPONENTS[key] : [];
};

// ── Helper to build BudgetPrintData from JoinedNewBudget ──
const buildPrintDataFromBudget = (
    budget: JoinedNewBudget,
    budgetItems: any[]
): BudgetPrintData => {
    const client = budget.project?.NEW_Clients;
    const location = (() => {
        // Infer location from iva_rate
        if (budget.iva_rate === 7) return 'canarias' as const;
        if (budget.iva_rate === 0) return 'internacional' as const;
        return 'peninsula' as const;
    })();

    // Build line items from budget items
    const lineItems: LineItem[] = [];

    // Base camperización is always present
    if (budget.base_price && budget.base_price > 0) {
        lineItems.push({
            name: 'Base Camperización + Modelo',
            subtitle: budget.model_option?.name,
            quantity: 1,
            unitPrice: budget.base_price,
            total: budget.base_price,
        });
    }

    // Pack
    if (budget.pack_price && budget.pack_price > 0) {
        lineItems.push({
            name: 'Pack Equipamiento',
            subtitle: budget.pack?.name,
            quantity: 1,
            unitPrice: budget.pack_price,
            total: budget.pack_price,
            subItems: budget.pack?.name ? getPackComponents(budget.pack.name) : [],
        });
    }

    // Electric system
    if (budget.electric_system_price && budget.electric_system_price > 0) {
        lineItems.push({
            name: 'Sistema Eléctrico',
            quantity: 1,
            unitPrice: budget.electric_system_price,
            total: budget.electric_system_price,
        });
    }

    // Color modifier
    if (budget.color_modifier && budget.color_modifier !== 0) {
        lineItems.push({
            name: 'Suplemento Color',
            quantity: 1,
            unitPrice: budget.color_modifier,
            total: budget.color_modifier,
        });
    }

    // Additional items from NEW_Budget_Items
    budgetItems.forEach((item: any) => {
        lineItems.push({
            name: item.name || 'Ítem',
            quantity: item.quantity || 1,
            unitPrice: item.price || 0,
            total: item.line_total || 0,
            isDiscount: item.is_discount || false,
            isCustom: item.is_custom || false,
        });
    });

    // Calculate derived values
    const subtotal = budget.subtotal || 0;
    const discountPercentage = budget.discount_percentage
        ? Math.round(budget.discount_percentage * 100)
        : 0;
    const discountPercentAmount = subtotal * (budget.discount_percentage || 0);
    const discountFixed = budget.discount_amount || 0;

    const totalAfterDiscounts = Math.max(0, subtotal - discountPercentAmount - discountFixed);
    const ivaRate = budget.iva_rate || 21;
    const precioBase = totalAfterDiscounts / (1 + ivaRate / 100);
    const ivaAmount = totalAfterDiscounts - precioBase;
    const total = budget.total || totalAfterDiscounts;
    const iedmt = location === 'peninsula' ? Math.round(totalAfterDiscounts * 0.0475) : 0;
    const totalWithIedmt = total + iedmt;

    const dateStr = budget.created_at
        ? format(new Date(budget.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })
        : new Date().toLocaleDateString('es-ES');

    return {
        budgetCode: budget.budget_code || 'BORRADOR',
        date: dateStr,
        location,
        clientName: client?.name || 'Cliente No Identificado',
        clientEmail: client?.email || '',
        clientPhone: client?.phone || '',
        modelName: budget.model_option?.name || '–',
        engineName: budget.engine_option?.name || '–',
        interiorColorName: '–',
        packName: budget.pack?.name || '–',
        lineItems,
        subtotal,
        discountPercentage,
        discountPercentAmount,
        discountFixed,
        ivaRate,
        ivaAmount,
        total,
        iedmt,
        totalWithIedmt,
        reservationAmount: budget.reservation_amount || 0,
    };
};

// ── Main Component ─────────────────────────────────────────
const Presupuestos = () => {
    const [searchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || '';
    const { data: budgets = [], isLoading } = useNewBudgets();

    // Print view state
    const [printViewOpen, setPrintViewOpen] = useState(false);
    const [printData, setPrintData] = useState<BudgetPrintData | null>(null);
    const [selectedBudgetId, setSelectedBudgetId] = useState<string | undefined>();

    // Editor state
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorBudgetId, setEditorBudgetId] = useState<string | undefined>();
    const [editorProjectId, setEditorProjectId] = useState<string | undefined>();
    const [editorClientName, setEditorClientName] = useState<string | undefined>();

    // Filters
    const [filter, setFilter] = useState(searchTerm);
    const [showOnlyPrimary, setShowOnlyPrimary] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>('all');

    // Fetch items for the selected budget (for print view)
    const { data: budgetItems = [] } = useNewBudgetItems(selectedBudgetId);

    const handleViewPrint = useCallback((budget: JoinedNewBudget) => {
        setSelectedBudgetId(budget.id);
        // Build print data immediately with empty items, will re-render when items load
        const data = buildPrintDataFromBudget(budget, []);
        setPrintData(data);
        setPrintViewOpen(true);
    }, []);

    // Re-build print data when budgetItems load
    React.useEffect(() => {
        if (selectedBudgetId && budgetItems.length > 0 && printViewOpen) {
            const budget = budgets.find(b => b.id === selectedBudgetId);
            if (budget) {
                const data = buildPrintDataFromBudget(budget, budgetItems);
                setPrintData(data);
            }
        }
    }, [budgetItems, selectedBudgetId, printViewOpen, budgets]);

    const handleEdit = useCallback((budget: JoinedNewBudget, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditorBudgetId(budget.id);
        setEditorProjectId(budget.project_id || undefined);
        setEditorClientName(budget.project?.NEW_Clients?.name);
        setEditorOpen(true);
    }, []);

    const filteredBudgets = budgets.filter(b => {
        const matchesSearch =
            b.budget_code?.toLowerCase().includes(filter.toLowerCase()) ||
            b.project?.NEW_Clients?.name?.toLowerCase().includes(filter.toLowerCase()) ||
            b.project?.project_code?.toLowerCase().includes(filter.toLowerCase());

        const matchesPrimary = !showOnlyPrimary || b.is_primary;
        const matchesModel = selectedModel === 'all' || b.model_option?.name === selectedModel;

        return matchesSearch && matchesPrimary && matchesModel;
    });

    const models = Array.from(new Set(budgets.map(b => b.model_option?.name).filter(Boolean)));


    return (
        <Layout title="Presupuestos">
            <div className="space-y-8 animate-fade-in">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por código o cliente..."
                            className="pl-10 rounded-xl"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-3 bg-muted/40 px-4 py-2 rounded-xl border border-border/50">
                        <Switch
                            id="primary-filter"
                            checked={showOnlyPrimary}
                            onCheckedChange={setShowOnlyPrimary}
                        />
                        <Label
                            htmlFor="primary-filter"
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                            <Star className={`h-3.5 w-3.5 animate-pulse-star ${showOnlyPrimary ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                            Solo Actuales
                        </Label>
                    </div>

                    <div className="flex items-center space-x-3 bg-muted/40 px-4 py-2 rounded-xl border border-border/50">
                        <Label htmlFor="model-select" className="text-sm font-medium">Modelo:</Label>
                        <select
                            id="model-select"
                            title="Filtrar por modelo"
                            aria-label="modelo"
                            className="bg-transparent border-none text-sm focus:ring-0 outline-none"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                        >
                            <option value="all">Todos los modelos</option>
                            {models.map(model => (
                                <option key={model} value={model || ''}>{model}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Cargando presupuestos...</p>
                    </div>
                ) : filteredBudgets.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-bold">No se encontraron presupuestos</h3>
                        <p className="text-muted-foreground">Prueba con otro término de búsqueda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBudgets.map((budget) => (
                            <Card
                                key={budget.id}
                                className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                                onClick={() => handleViewPrint(budget)}
                            >
                                {/* Primary Indicator Stripe */}
                                {budget.is_primary && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                                )}

                                <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-mono text-[10px] tracking-tighter">
                                                    {budget.budget_code}
                                                </Badge>
                                                {budget.is_primary && (
                                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse-star" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                                {budget.created_at ? new Date(budget.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                            </p>
                                        </div>
                                        {budget.is_primary && (
                                            <Badge
                                                variant="default"
                                                className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-3"
                                            >
                                                Actual
                                            </Badge>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                                            {budget.project?.NEW_Clients?.name || budget.project?.project_code || 'Varios / Stock'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {budget.model_option?.name || 'Sin modelo asignado'}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Presupuesto</p>
                                            <p className="text-2xl font-black text-primary">
                                                {budget.total?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="rounded-xl h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Editar presupuesto"
                                                onClick={(e) => handleEdit(budget, e)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="rounded-xl h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Ver presupuesto"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewPrint(budget);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Print View (new premium format) */}
            <BudgetPrintView
                open={printViewOpen}
                onOpenChange={(open) => {
                    setPrintViewOpen(open);
                    if (!open) {
                        setSelectedBudgetId(undefined);
                        setPrintData(null);
                    }
                }}
                data={printData}
            />

            {/* Budget Editor Modal */}
            <BudgetEditorModal
                open={editorOpen}
                onOpenChange={(open) => {
                    setEditorOpen(open);
                    if (!open) {
                        setEditorBudgetId(undefined);
                        setEditorProjectId(undefined);
                        setEditorClientName(undefined);
                    }
                }}
                budgetId={editorBudgetId}
                projectId={editorProjectId}
                clientName={editorClientName}
            />
        </Layout>
    );
};

export default Presupuestos;
