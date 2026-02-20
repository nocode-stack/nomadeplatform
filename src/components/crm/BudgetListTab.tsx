
import React, { useState, useCallback } from 'react';
import { Star, Eye, Pencil, Receipt, Loader2, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useProjectBudgets, useSetPrimaryBudget, useNewBudgetItems } from '../../hooks/useNewBudgets';
import { useToast } from '@/hooks/use-toast';
import BudgetEditorModal from './BudgetEditorModal';
import BudgetPrintView from './BudgetPrintView';
import type { BudgetPrintData, LineItem } from './BudgetPrintView';
import { JoinedNewBudget } from '@/types/budgets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BudgetListTabProps {
    projectId?: string;
    clientName?: string;
}

// ── Pack Components ────────────────────────────────────────
const PACK_COMPONENTS: Record<string, string[]> = {
    'Essentials': [
        'Escalón eléctrico',
        'Mosquitera corredera lateral',
        'Claraboya panorámica',
        'Sistema de gas GLP',
        'Monocontrol',
    ],
    'Adventure': [
        'Pack Essentials',
        'Ducha exterior',
        'Toldo',
        'Sistema de Litio (100Ah)',
        'Pack cine: proyector + pantalla + altavoces JBL',
    ],
    'Ultimate': [
        'Pack Essentials',
        'Pack Adventure',
        'Raintec (luz exterior)',
        'Llantas',
        'Revestimiento de ducha',
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
    const client = budget.client;
    const location = (() => {
        if (budget.iva_rate === 7) return 'canarias' as const;
        if (budget.iva_rate === 0) return 'internacional' as const;
        return 'peninsula' as const;
    })();

    const lineItems: LineItem[] = [];

    if (budget.base_price && budget.base_price > 0) {
        lineItems.push({
            name: 'Base Camperización + Modelo',
            subtitle: budget.model_option?.name,
            quantity: 1,
            unitPrice: budget.base_price,
            total: budget.base_price,
        });
    }

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

    if (budget.electric_system_price && budget.electric_system_price > 0) {
        lineItems.push({
            name: 'Sistema Eléctrico',
            quantity: 1,
            unitPrice: budget.electric_system_price,
            total: budget.electric_system_price,
        });
    }

    if (budget.color_modifier && budget.color_modifier !== 0) {
        lineItems.push({
            name: 'Suplemento Color',
            quantity: 1,
            unitPrice: budget.color_modifier,
            total: budget.color_modifier,
        });
    }

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

const BudgetListTab = ({ projectId, clientName }: BudgetListTabProps) => {
    const { data: budgets, isLoading } = useProjectBudgets(projectId || '');
    const setPrimaryMutation = useSetPrimaryBudget();
    const { toast } = useToast();
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingBudgetId, setEditingBudgetId] = useState<string | undefined>();

    // Print/View state
    const [printViewOpen, setPrintViewOpen] = useState(false);
    const [printData, setPrintData] = useState<BudgetPrintData | null>(null);
    const [selectedBudgetId, setSelectedBudgetId] = useState<string | undefined>();

    // Fetch items for the selected budget (for print view)
    const { data: budgetItems = [] } = useNewBudgetItems(selectedBudgetId);

    const handleCreateBudget = () => {
        if (!projectId) {
            toast({
                title: "Guarda el lead primero",
                description: "Necesitas registrar el lead antes de crear un presupuesto.",
                variant: "destructive",
            });
            return;
        }
        setEditingBudgetId(undefined);
        setEditorOpen(true);
    };

    const handleTogglePrimary = async (budgetId: string, currentlyPrimary: boolean) => {
        if (currentlyPrimary) return;
        try {
            await setPrimaryMutation.mutateAsync({ budgetId, clientId: projectId || '', confirmed: true });
            toast({
                title: "Presupuesto preferido actualizado",
                description: "Este presupuesto es ahora el principal del proyecto.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo actualizar el presupuesto preferido.",
                variant: "destructive",
            });
        }
    };

    const handleView = useCallback((budget: any) => {
        setSelectedBudgetId(budget.id);
        const data = buildPrintDataFromBudget(budget as JoinedNewBudget, []);
        setPrintData(data);
        setPrintViewOpen(true);
    }, []);

    // Re-build print data when budgetItems load
    React.useEffect(() => {
        if (selectedBudgetId && budgetItems.length > 0 && printViewOpen && budgets) {
            const budget = budgets.find(b => b.id === selectedBudgetId);
            if (budget) {
                const data = buildPrintDataFromBudget(budget as JoinedNewBudget, budgetItems);
                setPrintData(data);
            }
        }
    }, [budgetItems, selectedBudgetId, printViewOpen, budgets]);

    const handleEdit = (budgetId: string) => {
        setEditingBudgetId(budgetId);
        setEditorOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground font-medium">Cargando presupuestos...</span>
            </div>
        );
    }

    if (!budgets || budgets.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-muted/30 rounded-2xl mb-4">
                        <Receipt className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Sin presupuestos</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-4">
                        Este cliente aún no tiene presupuestos asociados.
                    </p>
                    <Button
                        type="button"
                        onClick={handleCreateBudget}
                        className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Presupuesto
                    </Button>
                </div>
                <BudgetEditorModal
                    open={editorOpen}
                    onOpenChange={setEditorOpen}
                    budgetId={editingBudgetId}
                    projectId={projectId}
                    clientName={clientName}
                />
            </>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {budgets.length} presupuesto{budgets.length !== 1 ? 's' : ''}
                </h3>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateBudget}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-9"
                >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Crear Presupuesto
                </Button>
            </div>

            {budgets.map((budget, index) => {
                const isPrimary = budget.is_primary;
                const isActive = budget.is_active !== false;
                const modelName = (budget as any).model_option?.name || 'Sin modelo';
                const engineName = (budget as any).engine_option?.name || '';
                const budgetLabel = (budget as any).budget_code || `Presupuesto #${budgets.length - index}`;
                const total = budget.total || 0;
                const createdAt = budget.created_at
                    ? new Date(budget.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })
                    : '';

                return (
                    <div
                        key={budget.id}
                        className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${isPrimary && isActive
                            ? 'border-primary/30 bg-primary/5 shadow-sm shadow-primary/10'
                            : 'border-border/50 bg-card hover:border-border hover:shadow-sm'
                            }`}
                    >
                        {/* Estrella de favorito */}
                        <button
                            type="button"
                            onClick={() => handleTogglePrimary(budget.id, !!isPrimary)}
                            className={`shrink-0 p-1.5 rounded-lg transition-all duration-300 ${isPrimary
                                ? 'text-amber-500 hover:text-amber-400'
                                : 'text-muted-foreground/30 hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                            title={isPrimary ? 'Presupuesto preferido' : 'Marcar como preferido'}
                        >
                            <Star
                                className={`w-5 h-5 transition-all duration-300 ${isPrimary ? 'fill-amber-500' : ''}`}
                            />
                        </button>

                        {/* Info del presupuesto */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm truncate">
                                    {budgetLabel}
                                </span>
                                {isPrimary && isActive && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        Principal
                                    </span>
                                )}
                                {!isActive && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                        Histórico
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {modelName}{engineName ? ` · ${engineName}` : ''} · {createdAt}
                            </p>
                        </div>

                        {/* Importe */}
                        <div className="shrink-0 text-right mr-2">
                            <span className={`text-lg font-black tabular-nums ${isPrimary && isActive ? 'text-primary' : 'text-foreground'}`}>
                                {total.toLocaleString('es-ES')}€
                            </span>
                        </div>

                        {/* Acciones */}
                        <div className="shrink-0 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handleView(budget)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                                title="Ver presupuesto"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            {isActive && (
                                <button
                                    type="button"
                                    onClick={() => handleEdit(budget.id)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                                    title="Editar presupuesto"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            <BudgetEditorModal
                open={editorOpen}
                onOpenChange={setEditorOpen}
                budgetId={editingBudgetId}
                projectId={projectId}
                clientName={clientName}
            />

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
        </div>
    );
};

export default BudgetListTab;
