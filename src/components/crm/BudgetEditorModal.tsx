import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
    X, Save, Eye, ChevronDown, MapPin, Check,
    Plus, Trash2, Loader2, FileText
} from 'lucide-react';
import {
    useModelOptions,
    useEngineOptions,
    useInteriorColorOptions,
    useNewBudgetPacks,
    useElectricSystems,
    useNewBudgetAdditionalItems,
    useNewBudgetItems,
} from '../../hooks/useNewBudgets';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import BudgetPrintView from './BudgetPrintView';
import type { BudgetPrintData, LineItem } from './BudgetPrintView';
import { useRegionalConfig, getPrice, getRegionalIva, getRegionalIedmt, getRegionalLegalText } from '../../hooks/useRegionalPricing';
import type { Location } from '../../hooks/useRegionalPricing';

interface CustomItem {
    id: string;
    name: string;
    price: number;
    selected: boolean;
}

interface BudgetEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    budgetId?: string;
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

// Returns ALL actual item names (not pack references) included in a pack, resolving hierarchy
const KNOWN_PACK_REFS = ['pack essentials', 'pack adventure', 'pack ultimate'];
const getExpandedPackComponents = (packName: string): string[] => {
    const components = getPackComponents(packName);
    const expanded: string[] = [];
    for (const comp of components) {
        if (KNOWN_PACK_REFS.includes(comp.toLowerCase())) {
            // Recursively expand known pack references
            expanded.push(...getExpandedPackComponents(comp));
        } else {
            expanded.push(comp);
        }
    }
    return expanded;
};

// ── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
    n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDecimal = (n: number) =>
    n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Section Header ─────────────────────────────────────────
const SectionHeader = ({ title, price, checked, onCheck, isRadio }: {
    title: string;
    price?: number;
    checked?: boolean;
    onCheck?: () => void;
    isRadio?: boolean;
}) => (
    <div className="flex items-center justify-between bg-[#2C3E50] text-white px-4 py-2.5 rounded-t-lg">
        <span className="font-bold text-sm tracking-wide uppercase">{title}</span>
        <div className="flex items-center gap-3">
            {price !== undefined && (
                <span className="font-bold text-sm">{fmt(price)}€</span>
            )}
            {onCheck && (
                <button
                    onClick={onCheck}
                    className={`w-5 h-5 rounded ${isRadio ? 'rounded-full' : 'rounded-[4px]'} border-2 border-white/50 flex items-center justify-center transition-all ${checked
                        ? 'bg-[#E8734A] border-[#E8734A]'
                        : 'bg-transparent hover:border-white'
                        }`}
                >
                    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
            )}
        </div>
    </div>
);

// ── Option Row ─────────────────────────────────────────────
const OptionRow = ({ name, price, checked, onCheck, isRadio, indent, disabled }: {
    name: string;
    price?: number;
    checked: boolean;
    onCheck: () => void;
    isRadio?: boolean;
    indent?: boolean;
    disabled?: boolean;
}) => (
    <div
        className={`flex items-center justify-between px-4 py-2 border-b border-[#E5E7EB] last:border-b-0 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#FFF7ED] cursor-pointer'
            } ${indent ? 'pl-8' : ''} ${checked && !disabled ? 'bg-[#FFF7ED]' : ''}`}
        onClick={() => !disabled && onCheck()}
    >
        <span className={`text-sm ${checked ? 'font-medium text-[#1A1A1A]' : 'text-[#4B5563]'}`}>
            {name}
        </span>
        <div className="flex items-center gap-3">
            {price !== undefined && (
                <span className={`text-sm tabular-nums ${price === 0 ? 'text-[#9CA3AF]' : 'text-[#1A1A1A] font-medium'}`}>
                    {fmt(price)}€
                </span>
            )}
            <div
                className={`w-[18px] h-[18px] flex-shrink-0 ${isRadio ? 'rounded-full' : 'rounded-[3px]'} border-2 flex items-center justify-center transition-all ${checked
                    ? 'bg-[#E8734A] border-[#E8734A] shadow-sm shadow-orange-200'
                    : 'border-[#CBD5E1] bg-white hover:border-[#E8734A]/50'
                    }`}
            >
                {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
        </div>
    </div>
);

// ── Main Component ─────────────────────────────────────────
const BudgetEditorModal = ({ open, onOpenChange, budgetId, projectId, clientName }: BudgetEditorModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [showPrintView, setShowPrintView] = useState(false);

    // Location state
    const [location, setLocation] = useState<Location>('peninsula');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showComunidadDropdown, setShowComunidadDropdown] = useState(false);
    const [comunidadAutonoma, setComunidadAutonoma] = useState<string | null>(null);
    const [budgetCode, setBudgetCode] = useState<string>('');

    // Comunidades autónomas list
    const comunidadesAutonomas = [
        'Andalucía',
        'Aragón',
        'Asturias (Principado de Asturias)',
        'Baleares',
        'Cantabria',
        'Castilla-La Mancha',
        'Castilla y León',
        'Catalunya',
        'Comunidad Valenciana',
        'Extremadura',
        'Galicia',
        'La Rioja',
        'Madrid',
        'Murcia',
        'Navarra',
        'País Vasco',
        'Ceuta',
        'Melilla',
    ];

    // Fetch option data
    const { data: models = [] } = useModelOptions();
    const { data: engines = [] } = useEngineOptions();
    const { data: interiorColors = [] } = useInteriorColorOptions();
    const { data: packs = [] } = useNewBudgetPacks();
    const { data: electricSystems = [] } = useElectricSystems();
    const { data: additionalItems = [] } = useNewBudgetAdditionalItems();
    const { data: existingBudgetItems = [] } = useNewBudgetItems(budgetId);
    const { data: regionalConfigs } = useRegionalConfig();

    // Selection state
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
    const [selectedInteriorColor, setSelectedInteriorColor] = useState<string | null>(null);
    const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());
    const [selectedElectric, setSelectedElectric] = useState<string | null>(null);
    const [selectedAdditionals, setSelectedAdditionals] = useState<Set<string>>(new Set());
    const [customItems, setCustomItems] = useState<CustomItem[]>([
        { id: crypto.randomUUID(), name: '', price: 0, selected: false },
        { id: crypto.randomUUID(), name: '', price: 0, selected: false },
        { id: crypto.randomUUID(), name: '', price: 0, selected: false },
    ]);

    // Discount state (separate & cumulative)
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [discountFixed, setDiscountFixed] = useState<number>(0);

    // Load existing budget data
    useEffect(() => {
        if (!budgetId) return;
        const loadBudget = async () => {
            const { data: budget } = await supabase
                .from('NEW_Budget')
                .select('*')
                .eq('id', budgetId)
                .single();
            if (budget) {
                setSelectedModel(budget.model_option_id);
                setSelectedEngine(budget.engine_option_id);
                setSelectedInteriorColor(budget.interior_color_id);
                setSelectedElectric(budget.electric_system_id);
                if (budget.pack_id) setSelectedPacks(new Set([budget.pack_id]));
                if (budget.budget_code) setBudgetCode(budget.budget_code);
                if (budget.discount_percentage) setDiscountPercent(budget.discount_percentage * 100);
                if (budget.discount_amount) setDiscountFixed(budget.discount_amount);
                if (budget.location) setLocation(budget.location as Location);
                if (budget.comunidad_autonoma) setComunidadAutonoma(budget.comunidad_autonoma);
            }
        };
        loadBudget();
    }, [budgetId]);

    // Load existing items as additional/custom selections
    useEffect(() => {
        if (existingBudgetItems.length > 0) {
            const additionalIds = new Set<string>();
            const customs: CustomItem[] = [];
            existingBudgetItems.forEach((item: any) => {
                if (item.is_custom) {
                    customs.push({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        selected: true,
                    });
                } else if (item.concept_id) {
                    additionalIds.add(item.concept_id);
                }
            });
            if (additionalIds.size > 0) setSelectedAdditionals(additionalIds);
            if (customs.length > 0) {
                // Merge with defaults, ensure minimum 3 rows
                const merged = [...customs];
                while (merged.length < 3) {
                    merged.push({ id: crypto.randomUUID(), name: '', price: 0, selected: false });
                }
                setCustomItems(merged);
            }
        }
    }, [existingBudgetItems]);

    // Toggle pack with hierarchy logic
    const togglePack = useCallback((packId: string, packName: string) => {
        setSelectedPacks(prev => {
            const next = new Set(prev);
            if (next.has(packId)) {
                next.delete(packId);
            } else {
                next.add(packId);
            }
            return next;
        });
    }, []);

    // ── Price Calculations ─────────────────────────────────
    const calculations = useMemo(() => {
        const modelObj = models.find(m => m.id === selectedModel);
        const engineObj = engines.find(e => e.id === selectedEngine);
        const colorObj = interiorColors.find(c => c.id === selectedInteriorColor);

        const modelPrice = getPrice(modelObj, location);
        const enginePrice = getPrice(engineObj, location);
        const colorPrice = getPrice(colorObj, location);

        const basePrice = modelPrice + enginePrice + colorPrice;

        let packsTotal = 0;
        packs.forEach(p => {
            if (selectedPacks.has(p.id)) {
                packsTotal += getPrice(p, location);
            }
        });

        const electricObj = electricSystems.find(e => e.id === selectedElectric);
        const electricPrice = getPrice(electricObj, location);

        let additionalsTotal = 0;
        additionalItems.forEach((item: any) => {
            if (selectedAdditionals.has(item.id)) {
                additionalsTotal += getPrice(item, location);
            }
        });

        let customTotal = 0;
        customItems.forEach(item => {
            if (item.selected && item.name.trim()) {
                customTotal += item.price || 0;
            }
        });

        const optionalsTotal = packsTotal + electricPrice + additionalsTotal + customTotal;
        const pvpTotal = basePrice + optionalsTotal;

        // Apply discounts (cumulative: % first, then fixed)
        const discountPercentAmount = pvpTotal * (discountPercent / 100);
        const totalAfterDiscounts = Math.max(0, pvpTotal - discountPercentAmount - discountFixed);

        // IVA from regional_config (fallback hardcoded)
        const { rate: ivaRate } = getRegionalIva(regionalConfigs, location);
        const precioBase = totalAfterDiscounts / (1 + ivaRate / 100);
        const ivaAmount = totalAfterDiscounts - precioBase;
        const total = totalAfterDiscounts;

        // IEDMT from regional_config
        const { rate: iedmtRate, applies: iedmtApplies } = getRegionalIedmt(regionalConfigs, location);
        const iedmt = iedmtApplies ? Math.round(totalAfterDiscounts * (iedmtRate / 100)) : 0;
        const totalWithIedmt = total + iedmt;

        return {
            basePrice,
            modelPrice,
            optionalsTotal,
            pvpTotal,
            discountPercentAmount,
            totalAfterDiscounts,
            precioBase,
            ivaRate,
            ivaAmount,
            total,
            iedmt,
            totalWithIedmt,
            packsTotal,
            electricPrice,
            additionalsTotal,
            customTotal,
        };
    }, [selectedModel, selectedEngine, selectedInteriorColor, selectedPacks,
        selectedElectric, selectedAdditionals, customItems, location,
        models, engines, interiorColors, packs, electricSystems, additionalItems,
        discountPercent, discountFixed, regionalConfigs]);

    // ── Save Handler ───────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!projectId) {
                toast({
                    title: 'Guarda el lead primero',
                    description: 'Necesitas registrar el lead antes de crear un presupuesto.',
                    variant: 'destructive',
                });
                setIsSaving(false);
                return;
            }

            const budgetPayload = {
                model_option_id: selectedModel,
                engine_option_id: selectedEngine,
                interior_color_id: selectedInteriorColor,
                electric_system_id: selectedElectric,
                pack_id: selectedPacks.size > 0 ? [...selectedPacks][0] : null,
                base_price: calculations.basePrice,
                pack_price: calculations.packsTotal,
                electric_system_price: calculations.electricPrice,
                subtotal: calculations.pvpTotal,
                total: calculations.total,
                discount_percentage: discountPercent / 100,
                discount_amount: discountFixed,
                location: location,
                comunidad_autonoma: location === 'peninsula' ? comunidadAutonoma : null,
                iva_rate: calculations.ivaRate,
            };

            // Si estamos editando un presupuesto existente, marcarlo como inactivo
            if (budgetId) {
                await supabase
                    .from('NEW_Budget')
                    .update({ is_active: false, is_primary: false })
                    .eq('id', budgetId);
            }

            // Siempre crear un nuevo presupuesto (histórico)
            const { data: newBudget, error: createError } = await supabase
                .from('NEW_Budget')
                .insert({
                    project_id: projectId,
                    status: 'draft',
                    is_primary: true,
                    is_active: true,
                    ...budgetPayload,
                })
                .select()
                .single();

            if (createError) throw createError;
            const activeBudgetId = newBudget.id;

            // Insert additional items
            const itemsToInsert: any[] = [];
            additionalItems.forEach((item: any) => {
                if (selectedAdditionals.has(item.id)) {
                    const itemPrice = getPrice(item, location);
                    itemsToInsert.push({
                        budget_id: activeBudgetId,
                        concept_id: item.id,
                        name: item.name,
                        price: itemPrice,
                        quantity: 1,
                        line_total: itemPrice,
                        is_custom: false,
                        is_discount: false,
                        order_index: itemsToInsert.length,
                    });
                }
            });

            // Insert custom items
            customItems.forEach(item => {
                if (item.selected && item.name.trim()) {
                    itemsToInsert.push({
                        budget_id: activeBudgetId,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                        line_total: item.price,
                        is_custom: true,
                        is_discount: false,
                        order_index: itemsToInsert.length,
                    });
                }
            });

            if (itemsToInsert.length > 0) {
                const { error: itemsError } = await supabase
                    .from('NEW_Budget_Items')
                    .insert(itemsToInsert);
                if (itemsError) throw itemsError;
            }

            queryClient.invalidateQueries({ queryKey: ['project-budgets'] });
            queryClient.invalidateQueries({ queryKey: ['new-budget-items'] });

            toast({
                title: budgetId ? 'Nueva versión creada' : 'Presupuesto creado',
                description: budgetId
                    ? `Se ha creado una nueva versión del presupuesto (${newBudget.budget_code}). La versión anterior se conserva en el histórico.`
                    : `El presupuesto ${newBudget.budget_code} se ha creado correctamente.`,
            });
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving budget:', error);
            toast({
                title: 'Error',
                description: error.message || 'Error al guardar el presupuesto.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Location labels ────────────────────────────────────
    const locationLabels: Record<Location, string> = {
        peninsula: 'España - Península',
        canarias: 'España - Canarias',
        internacional: 'Internacional',
    };

    const locationLegalText: Record<Location, string> = {
        peninsula: getRegionalLegalText(regionalConfigs, 'peninsula') || 'Precios con IVA (21%) incluido. IEDMT no incluido en el PVP, se calcula según la normativa vigente. Presupuesto válido 30 días.',
        canarias: getRegionalLegalText(regionalConfigs, 'canarias') || 'Precios con IGIC (7%) incluido. Exento de IEDMT. Gastos de transporte a Canarias no incluidos. Presupuesto válido 30 días.',
        internacional: getRegionalLegalText(regionalConfigs, 'internacional') || 'Precios sin impuestos locales. Transporte internacional no incluido. Presupuesto válido 30 días.',
    };

    // ── Build Print Data ────────────────────────────────────
    const buildPrintData = useCallback(async (): Promise<BudgetPrintData> => {
        // Fetch client info
        let printClientName = clientName || 'Cliente';
        let printClientEmail = '';
        let printClientPhone = '';

        if (projectId) {
            const { data: project } = await supabase
                .from('NEW_Projects')
                .select('NEW_Clients(name, email, phone)')
                .eq('id', projectId)
                .single();
            if (project?.NEW_Clients) {
                const c = project.NEW_Clients as any;
                printClientName = c.name || printClientName;
                printClientEmail = c.email || '';
                printClientPhone = c.phone || '';
            }
        }

        const modelObj = models.find(m => m.id === selectedModel);
        const engineObj = engines.find(e => e.id === selectedEngine);
        const colorObj = interiorColors.find(c => c.id === selectedInteriorColor);
        const electricObj = electricSystems.find(e => e.id === selectedElectric) as any;
        const selectedPacksList = packs.filter(p => selectedPacks.has(p.id));

        // Build line items
        const lineItems: LineItem[] = [];

        // Base
        lineItems.push({
            name: 'Base Camperización + Modelo',
            subtitle: modelObj?.name,
            quantity: 1,
            unitPrice: calculations.basePrice,
            total: calculations.basePrice,
        });

        // Packs
        selectedPacksList.forEach((p: any) => {
            const packPrice = getPrice(p, location);
            lineItems.push({
                name: 'Pack Equipamiento',
                subtitle: p.name,
                quantity: 1,
                unitPrice: packPrice,
                total: packPrice,
                subItems: getPackComponents(p.name),
            });
        });

        // Electric
        if (electricObj && calculations.electricPrice > 0) {
            lineItems.push({
                name: 'Sistema Eléctrico',
                subtitle: electricObj.name,
                quantity: 1,
                unitPrice: calculations.electricPrice,
                total: calculations.electricPrice,
            });
        }

        // Additionals
        additionalItems.forEach((item: any) => {
            if (selectedAdditionals.has(item.id)) {
                const itemPrice = getPrice(item, location);
                lineItems.push({
                    name: item.name,
                    quantity: 1,
                    unitPrice: itemPrice,
                    total: itemPrice,
                });
            }
        });

        // Custom items
        customItems.forEach(item => {
            if (item.selected && item.name.trim()) {
                lineItems.push({
                    name: item.name,
                    quantity: 1,
                    unitPrice: item.price,
                    total: item.price,
                    isCustom: true,
                });
            }
        });

        return {
            budgetCode: budgetCode || 'BORRADOR',
            date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
            location,
            clientName: printClientName,
            clientEmail: printClientEmail,
            clientPhone: printClientPhone,
            modelName: modelObj?.name || '–',
            engineName: engineObj?.name || '–',
            interiorColorName: colorObj?.name || '–',
            packName: selectedPacksList.map((p: any) => p.name).join(', ') || '–',
            lineItems,
            subtotal: calculations.pvpTotal,
            discountPercentage: discountPercent,
            discountPercentAmount: calculations.discountPercentAmount,
            discountFixed: discountFixed,
            ivaRate: calculations.ivaRate,
            ivaAmount: calculations.ivaAmount,
            total: calculations.total,
            iedmt: calculations.iedmt,
            totalWithIedmt: calculations.totalWithIedmt,
        };
    }, [budgetCode, location, clientName, projectId, selectedModel, selectedEngine,
        selectedInteriorColor, selectedElectric, selectedPacks, selectedAdditionals,
        customItems, models, engines, interiorColors, packs, electricSystems,
        additionalItems, calculations]);

    const [printData, setPrintData] = useState<BudgetPrintData | null>(null);

    const handlePrint = async () => {
        const data = await buildPrintData();
        setPrintData(data);
        setShowPrintView(true);
    };

    // ── Render ─────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1200px] max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl bg-[#F9FAFB] gap-0 rounded-2xl">

                {/* ─── HEADER ───────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E5E7EB] shrink-0">
                    <div className="flex items-center gap-4">
                        <img src="/lovable-uploads/logo.png" alt="Nomade" className="h-8 w-auto" />
                        <div className="h-6 w-px bg-[#E5E7EB]" />
                        <div>
                            <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Configurador</p>
                            <h2 className="text-lg font-bold text-[#1A1A1A]">
                                {clientName || 'Presupuesto'}
                            </h2>
                        </div>
                    </div>

                    {/* Location Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors"
                        >
                            <MapPin className="w-4 h-4 text-[#E8734A]" />
                            <span className="text-sm font-medium">{locationLabels[location]}</span>
                            <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                        </button>
                        {showLocationDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowLocationDropdown(false)} />
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden min-w-[200px]">
                                    {Object.entries(locationLabels).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => { setLocation(key as Location); if (key !== 'peninsula') setComunidadAutonoma(null); setShowLocationDropdown(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-[#FFF7ED] transition-colors flex items-center gap-2 ${location === key ? 'bg-[#FFF7ED] text-[#E8734A] font-medium' : 'text-[#4B5563]'
                                                }`}
                                        >
                                            {location === key && <Check className="w-4 h-4" />}
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Comunidad Autónoma Dropdown - only for Península */}
                    {location === 'peninsula' && (
                        <div className="relative">
                            <button
                                onClick={() => setShowComunidadDropdown(!showComunidadDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors"
                            >
                                <span className="text-sm font-medium">{comunidadAutonoma || 'Comunidad Autónoma'}</span>
                                <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                            </button>
                            {showComunidadDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowComunidadDropdown(false)} />
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden min-w-[240px] max-h-[300px] overflow-y-auto">
                                        {comunidadesAutonomas.map((ca) => (
                                            <button
                                                key={ca}
                                                onClick={() => { setComunidadAutonoma(ca); setShowComunidadDropdown(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-[#FFF7ED] transition-colors flex items-center gap-2 ${comunidadAutonoma === ca ? 'bg-[#FFF7ED] text-[#E8734A] font-medium' : 'text-[#4B5563]'}`}
                                            >
                                                {comunidadAutonoma === ca && <Check className="w-4 h-4" />}
                                                {ca}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 rounded-xl border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]"
                        >
                            <Eye className="w-4 h-4" /> Ver
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="gap-2 rounded-xl bg-[#E8734A] hover:bg-[#D4633D] text-white shadow-md shadow-orange-200"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar
                        </Button>
                    </div>
                </div>

                {/* ─── BODY: 2 column layout ────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* LEFT: Configurator (scrollable) */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

                        {/* ── BASE ─────────────────────── */}
                        <div className="space-y-0">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-[#E8734A] rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Base</h3>
                            </div>

                            {/* Modelo */}
                            <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden mb-3 shadow-sm">
                                <SectionHeader title="Modelo" />
                                {models.map(model => (
                                    <OptionRow
                                        key={model.id}
                                        name={model.name}
                                        price={getPrice(model, location)}
                                        checked={selectedModel === model.id}
                                        onCheck={() => setSelectedModel(model.id)}
                                        isRadio
                                    />
                                ))}
                            </div>

                            {/* Vehículo */}
                            <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden mb-3 shadow-sm">
                                <SectionHeader title="Vehículo: Fiat Ducato 9.2" />
                                {engines.map(engine => (
                                    <OptionRow
                                        key={engine.id}
                                        name={engine.name}
                                        price={getPrice(engine, location)}
                                        checked={selectedEngine === engine.id}
                                        onCheck={() => setSelectedEngine(engine.id)}
                                        isRadio
                                    />
                                ))}
                            </div>

                            {/* Color Interior Muebles */}
                            <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden shadow-sm">
                                <SectionHeader title="Color Interior Muebles" />
                                {interiorColors.map(color => (
                                    <OptionRow
                                        key={color.id}
                                        name={color.name}
                                        price={getPrice(color, location)}
                                        checked={selectedInteriorColor === color.id}
                                        onCheck={() => setSelectedInteriorColor(color.id)}
                                        isRadio
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ── OPCIONALES ───────────────── */}
                        <div className="space-y-0">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-[#E8734A] rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Opcionales</h3>
                            </div>

                            {/* Packs */}
                            {[...packs].sort((a: any, b: any) => getPrice(a, location) - getPrice(b, location)).map((pack: any) => {
                                const components = getPackComponents(pack.name);
                                return (
                                    <div key={pack.id} className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden mb-3 shadow-sm">
                                        <SectionHeader
                                            title={pack.name}
                                            price={getPrice(pack, location)}
                                            checked={selectedPacks.has(pack.id)}
                                            onCheck={() => togglePack(pack.id, pack.name)}
                                        />
                                        {components.length > 0 && (
                                            <div className="px-4 py-2.5 border-t border-[#F3F4F6] bg-[#FAFBFC]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">Incluye:</p>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                    {components.map((comp, idx) => (
                                                        <div key={idx} className="flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-[#E8734A]/40 flex-shrink-0" />
                                                            <span className="text-[11px] text-[#6B7280]">{comp}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Individual Optionals */}
                            {additionalItems.length > 0 && (
                                <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden mb-3 shadow-sm">
                                    <SectionHeader title="Opcionales Individuales" />
                                    {additionalItems
                                        .filter((item: any) => {
                                            // Hide items already included in the selected pack
                                            const selectedPackNames = packs
                                                .filter((p: any) => selectedPacks.has(p.id))
                                                .map((p: any) => p.name);
                                            const includedNames = selectedPackNames.flatMap(getExpandedPackComponents)
                                                .map(n => n.toLowerCase());
                                            return !includedNames.some(inc =>
                                                item.name?.toLowerCase().includes(inc) || inc.includes(item.name?.toLowerCase())
                                            );
                                        })
                                        .map((item: any) => (
                                            <OptionRow
                                                key={item.id}
                                                name={item.name}
                                                price={getPrice(item, location)}
                                                checked={selectedAdditionals.has(item.id)}
                                                onCheck={() => {
                                                    setSelectedAdditionals(prev => {
                                                        const next = new Set(prev);
                                                        next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                                                        return next;
                                                    });
                                                }}
                                            />
                                        ))}
                                </div>
                            )}

                            {/* Electric System */}
                            <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden mb-3 shadow-sm">
                                <SectionHeader title="Sistema Eléctrico" />
                                {electricSystems.filter((sys: any) => sys.name?.toLowerCase().startsWith('sistema')).map((sys: any) => (
                                    <OptionRow
                                        key={sys.id}
                                        name={sys.name}
                                        price={getPrice(sys, location)}
                                        checked={selectedElectric === sys.id}
                                        onCheck={() => setSelectedElectric(
                                            selectedElectric === sys.id ? null : sys.id
                                        )}
                                        isRadio
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ── PETICIÓN CLIENTE ─────────── */}
                        <div className="space-y-0">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-[#E8734A] rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Petición Cliente</h3>
                            </div>

                            <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden shadow-sm">
                                <SectionHeader title="Petición Cliente" />
                                {customItems.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 px-4 py-2.5 border-b border-[#E5E7EB] last:border-b-0"
                                    >
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => {
                                                const updated = [...customItems];
                                                updated[idx] = { ...item, name: e.target.value };
                                                setCustomItems(updated);
                                            }}
                                            placeholder={`Concepto ${idx + 1}`}
                                            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-[#CBD5E1]"
                                        />
                                        <input
                                            type="number"
                                            value={item.price || ''}
                                            onChange={(e) => {
                                                const updated = [...customItems];
                                                updated[idx] = { ...item, price: parseFloat(e.target.value) || 0 };
                                                setCustomItems(updated);
                                            }}
                                            placeholder="0"
                                            className="w-24 text-sm text-right bg-transparent border-none outline-none placeholder:text-[#CBD5E1] tabular-nums"
                                        />
                                        <span className="text-sm text-[#9CA3AF]">€</span>
                                        <div
                                            onClick={() => {
                                                const updated = [...customItems];
                                                updated[idx] = { ...item, selected: !item.selected };
                                                setCustomItems(updated);
                                            }}
                                            className={`w-[18px] h-[18px] flex-shrink-0 rounded-[3px] border-2 flex items-center justify-center cursor-pointer transition-all ${item.selected
                                                ? 'bg-[#E8734A] border-[#E8734A] shadow-sm shadow-orange-200'
                                                : 'border-[#CBD5E1] bg-white hover:border-[#E8734A]/50'
                                                }`}
                                        >
                                            {item.selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() =>
                                        setCustomItems([
                                            ...customItems,
                                            { id: crypto.randomUUID(), name: '', price: 0, selected: false },
                                        ])
                                    }
                                    className="flex items-center gap-2 px-4 py-2 text-xs text-[#E8734A] font-medium hover:bg-[#FFF7ED] transition-colors w-full"
                                >
                                    <Plus className="w-3 h-3" /> Añadir concepto
                                </button>
                            </div>
                        </div>

                        {/* ── Discounts Section ────────── */}
                        <div className="pt-6">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">
                                Descuentos
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Descuento % */}
                                <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
                                    <div className="px-3 py-1.5 bg-[#F8F9FA] border-b border-[#E5E7EB]">
                                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Descuento (%)</p>
                                    </div>
                                    <div className="flex items-center px-3 py-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={discountPercent || ''}
                                            onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                            placeholder="0"
                                            className="flex-1 text-sm font-bold text-right bg-transparent border-none outline-none tabular-nums placeholder:text-[#CBD5E1]"
                                        />
                                        <span className="text-sm font-bold text-[#E8734A] ml-1">%</span>
                                    </div>
                                    {discountPercent > 0 && (
                                        <div className="px-3 pb-2">
                                            <p className="text-[10px] text-emerald-600 font-medium">-{fmtDecimal(calculations.discountPercentAmount)} €</p>
                                        </div>
                                    )}
                                </div>

                                {/* Descuento € */}
                                <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
                                    <div className="px-3 py-1.5 bg-[#F8F9FA] border-b border-[#E5E7EB]">
                                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Descuento (€)</p>
                                    </div>
                                    <div className="flex items-center px-3 py-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={discountFixed || ''}
                                            onChange={(e) => setDiscountFixed(Math.max(0, parseFloat(e.target.value) || 0))}
                                            placeholder="0"
                                            className="flex-1 text-sm font-bold text-right bg-transparent border-none outline-none tabular-nums placeholder:text-[#CBD5E1]"
                                        />
                                        <span className="text-sm font-bold text-[#E8734A] ml-1">€</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Legal Footer Text ────────── */}
                        <div className="pt-4 pb-8">
                            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                                {locationLegalText[location]}
                            </p>
                            <p className="text-[10px] text-[#CBD5E1] mt-1">
                                © {new Date().getFullYear()} Nomade Vans S.L. – Todos los derechos reservados.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: Summary Panel (sticky) */}
                    <div className="w-[340px] bg-white border-l border-[#E5E7EB] flex flex-col shrink-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">

                            {/* Budget Code */}
                            <div className="text-center pb-4 border-b border-[#E5E7EB]">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Resumen</p>
                                <FileText className="w-8 h-8 text-[#E8734A] mx-auto mt-2" />
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold">Descripción</p>
                                    </div>
                                    <p className="text-sm font-bold">PVP</p>
                                </div>
                                <Separator className="bg-[#E5E7EB]" />

                                <div className="flex justify-between">
                                    <p className="text-sm font-bold text-[#1A1A1A]">Nomade Camper Base</p>
                                    <p className="text-sm font-bold tabular-nums">{fmt(calculations.basePrice)} €</p>
                                </div>

                                {/* Opcionales - desglose detallado */}
                                {calculations.optionalsTotal > 0 && (
                                    <div className="space-y-1.5 pl-3 border-l-2 border-[#E8734A]/20">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Opcionales</p>

                                        {/* Packs */}
                                        {packs.filter(p => selectedPacks.has(p.id)).map(p => {
                                            const components = getPackComponents(p.name);
                                            return (
                                                <div key={p.id}>
                                                    <div className="flex justify-between">
                                                        <p className="text-xs text-[#4B5563] truncate pr-2">{p.name}</p>
                                                        <p className="text-xs font-medium tabular-nums whitespace-nowrap">{fmt(getPrice(p, location))} €</p>
                                                    </div>
                                                    {components.length > 0 && (
                                                        <div className="ml-2 mt-0.5 mb-1 space-y-0.5">
                                                            {components.map((comp, idx) => (
                                                                <div key={idx} className="flex items-center gap-1.5">
                                                                    <div className="w-0.5 h-0.5 rounded-full bg-[#E8734A]/40 flex-shrink-0" />
                                                                    <span className="text-[10px] text-[#9CA3AF]">{comp}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Sistema eléctrico */}
                                        {selectedElectric && electricSystems.find(e => e.id === selectedElectric) && (
                                            <div className="flex justify-between">
                                                <p className="text-xs text-[#4B5563] truncate pr-2">{electricSystems.find(e => e.id === selectedElectric)?.name}</p>
                                                <p className="text-xs font-medium tabular-nums whitespace-nowrap">{fmt(calculations.electricPrice)} €</p>
                                            </div>
                                        )}

                                        {/* Items adicionales */}
                                        {additionalItems.filter((item: any) => selectedAdditionals.has(item.id)).map((item: any) => (
                                            <div key={item.id} className="flex justify-between">
                                                <p className="text-xs text-[#4B5563] truncate pr-2">{item.name}</p>
                                                <p className="text-xs font-medium tabular-nums whitespace-nowrap">{fmt(getPrice(item, location))} €</p>
                                            </div>
                                        ))}

                                        {/* Items personalizados */}
                                        {customItems.filter(item => item.selected && item.name.trim()).map((item, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <p className="text-xs text-[#4B5563] truncate pr-2">{item.name}</p>
                                                <p className="text-xs font-medium tabular-nums whitespace-nowrap">{fmt(item.price || 0)} €</p>
                                            </div>
                                        ))}

                                        {/* Subtotal opcionales */}
                                        <div className="flex justify-between pt-1 border-t border-dashed border-[#E5E7EB]">
                                            <p className="text-xs font-semibold text-[#4B5563]">Total Opcionales</p>
                                            <p className="text-xs font-bold tabular-nums">{fmt(calculations.optionalsTotal)} €</p>
                                        </div>
                                    </div>
                                )}

                                <Separator className="bg-[#E5E7EB]" />

                                {/* PVP Before Discounts */}
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-bold">PVP Bruto</p>
                                    <p className="text-sm font-bold tabular-nums">
                                        {fmtDecimal(calculations.pvpTotal)} €
                                    </p>
                                </div>

                                {/* Discount lines */}
                                {discountPercent > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 italic">
                                        <span>Dto. {discountPercent}%</span>
                                        <span className="font-bold tabular-nums">-{fmtDecimal(calculations.discountPercentAmount)} €</span>
                                    </div>
                                )}
                                {discountFixed > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 italic">
                                        <span>Dto. fijo</span>
                                        <span className="font-bold tabular-nums">-{fmtDecimal(discountFixed)} €</span>
                                    </div>
                                )}

                                {/* PVP with discounts applied */}
                                <div className="flex justify-between items-center bg-[#F3F4F6] -mx-6 px-6 py-3">
                                    <p className="text-sm font-bold uppercase">PVP Total</p>
                                    <p className="text-xl font-black text-[#1A1A1A] tabular-nums">
                                        {fmtDecimal(calculations.totalAfterDiscounts)} €
                                    </p>
                                </div>

                                {/* Tax breakdown */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#9CA3AF]">Precio base</span>
                                        <span className="tabular-nums">{fmtDecimal(calculations.precioBase)} €</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#9CA3AF]">
                                            {location === 'canarias' ? 'IGIC' : 'IVA'} {calculations.ivaRate}%
                                        </span>
                                        <span className="tabular-nums">{fmtDecimal(calculations.ivaAmount)} €</span>
                                    </div>
                                    <Separator className="bg-[#E5E7EB]" />
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold">Total</span>
                                        <span className="font-bold tabular-nums">{fmtDecimal(calculations.total)} €</span>
                                    </div>

                                    {location === 'peninsula' && (
                                        <>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[#9CA3AF]">+IEDMT</span>
                                                <span className="tabular-nums">{fmtDecimal(calculations.iedmt)} €</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-[#2C3E50] -mx-6 px-6 py-3 rounded-lg mt-2">
                                                <span className="text-white font-bold text-xs uppercase tracking-wider">Total+IEDMT</span>
                                                <span className="text-white font-black text-lg tabular-nums">
                                                    {fmtDecimal(calculations.totalWithIedmt)} €
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {location !== 'peninsula' && (
                                        <div className="flex justify-between items-center bg-[#2C3E50] -mx-6 px-6 py-3 rounded-lg mt-2">
                                            <span className="text-white font-bold text-xs uppercase tracking-wider">Total</span>
                                            <span className="text-white font-black text-lg tabular-nums">
                                                {fmtDecimal(calculations.total)} €
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print View Modal */}
                <BudgetPrintView
                    open={showPrintView}
                    onOpenChange={setShowPrintView}
                    data={printData}
                />
            </DialogContent>
        </Dialog>
    );
};

export default BudgetEditorModal;
