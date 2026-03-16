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
    Plus, Trash2, Loader2, FileText, Search
} from 'lucide-react';
import {
    useModelOptions,
    useEngineOptions,
    useInteriorColorOptions,
    useNewBudgetPacks,
    useElectricSystems,
    useNewBudgetAdditionalItems,
    useNewBudgetItems,
    useNewBudgetExtraPacks,
    useNewBudgetExtraPackComponents,
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
const SectionHeader = ({ title, price, checked, onCheck, isRadio, bgColor }: {
    title: string;
    price?: number;
    checked?: boolean;
    onCheck?: () => void;
    isRadio?: boolean;
    bgColor?: string;
}) => (
    <div className="flex items-center justify-between text-white px-4 py-2.5 rounded-t-lg" style={{ backgroundColor: bgColor || '#2C3E50' }}>
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
    const { data: extraPacks = [] } = useNewBudgetExtraPacks();
    const { data: extraPackComponents = [] } = useNewBudgetExtraPackComponents();
    const { data: existingBudgetItems = [] } = useNewBudgetItems(budgetId);
    const { data: regionalConfigs } = useRegionalConfig();

    // Selection state
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
    const [selectedInteriorColor, setSelectedInteriorColor] = useState<string | null>(null);
    const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());
    const [selectedElectric, setSelectedElectric] = useState<string | null>(null);
    const [selectedAdditionals, setSelectedAdditionals] = useState<Set<string>>(new Set());
    const [selectedExtraPacks, setSelectedExtraPacks] = useState<Set<string>>(new Set());
    const [customItems, setCustomItems] = useState<CustomItem[]>([
        { id: crypto.randomUUID(), name: '', price: 0, selected: false },
        { id: crypto.randomUUID(), name: '', price: 0, selected: false },
        { id: crypto.randomUUID(), name: '', price: 0, selected: false },
    ]);

    // Discount state (separate & cumulative)
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [discountFixed, setDiscountFixed] = useState<number>(0);
    const [discountPercentLabel, setDiscountPercentLabel] = useState<string>('');
    const [discountFixedLabel, setDiscountFixedLabel] = useState<string>('');

    // Fuera de Carta search state
    const [outOfOfferSearch, setOutOfOfferSearch] = useState<string>('');
    const [outOfOfferOpen, setOutOfOfferOpen] = useState<boolean>(false);

    // Load existing budget data
    useEffect(() => {
        if (!budgetId) return;
        const loadBudget = async () => {
            const { data: budget } = await supabase
                .from('budget')
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
                if (budget.discount_percentage_label) setDiscountPercentLabel(budget.discount_percentage_label);
                if (budget.discount_amount_label) setDiscountFixedLabel(budget.discount_amount_label);
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
            const extraPackIds = new Set<string>();
            const extraPackIdSet = new Set(extraPacks.map((ep: any) => ep.id));
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
                    // Check if this concept_id belongs to an extra pack
                    if (extraPackIdSet.has(item.concept_id)) {
                        extraPackIds.add(item.concept_id);
                    } else {
                        additionalIds.add(item.concept_id);
                    }
                }
            });
            if (additionalIds.size > 0) setSelectedAdditionals(additionalIds);
            if (extraPackIds.size > 0) setSelectedExtraPacks(extraPackIds);
            if (customs.length > 0) {
                // Merge with defaults, ensure minimum 3 rows
                const merged = [...customs];
                while (merged.length < 3) {
                    merged.push({ id: crypto.randomUUID(), name: '', price: 0, selected: false });
                }
                setCustomItems(merged);
            }
        }
    }, [existingBudgetItems, extraPacks]);

    // Auto-deselect Space Pack si se cambia a un modelo no-Space
    useEffect(() => {
        const selectedModelObj = models.find(m => m.id === selectedModel);
        const isSpaceModel = selectedModelObj?.name?.toLowerCase().includes('space') || false;
        if (!isSpaceModel) {
            const spacePackId = extraPacks.find((ep: any) => ep.name?.toLowerCase().includes('space'))?.id;
            if (spacePackId && selectedExtraPacks.has(spacePackId)) {
                setSelectedExtraPacks(prev => {
                    const next = new Set(prev);
                    next.delete(spacePackId);
                    return next;
                });
            }
        }
    }, [selectedModel, models, extraPacks]);

    // Toggle pack — solo uno a la vez (Essentials, Adventure, Ultimate son mutuamente excluyentes)
    const togglePack = useCallback((packId: string, packName: string) => {
        setSelectedPacks(prev => {
            if (prev.has(packId)) {
                // Deseleccionar si ya está seleccionado
                return new Set();
            } else {
                // Seleccionar solo este pack (reemplaza cualquier selección anterior)
                return new Set([packId]);
            }
        });
    }, []);

    // ── Helper: Electric system price considering Pack Ultimate discount ──
    const getElectricDiscountPrice = useCallback((sys: any, loc: Location): number => {
        if (!sys) return 0;
        const selectedPackName = packs.find((p: any) => selectedPacks.has(p.id))?.name || '';
        const isUltimateOrAdventure = selectedPackName.includes('Ultimate') || selectedPackName.includes('Adventure');
        if (isUltimateOrAdventure) {
            if (loc === 'peninsula') {
                return sys.discount_price != null ? Number(sys.discount_price) : (sys.price ?? 0);
            } else {
                return sys.discount_price_export != null ? Number(sys.discount_price_export) : (sys.price_export ?? sys.price ?? 0);
            }
        }
        return getPrice(sys, loc);
    }, [packs, selectedPacks]);

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

        let extraPacksTotal = 0;
        extraPacks.forEach((ep: any) => {
            if (selectedExtraPacks.has(ep.id)) {
                extraPacksTotal += getPrice(ep, location);
            }
        });

        const electricObj = electricSystems.find(e => e.id === selectedElectric);
        const electricPrice = getElectricDiscountPrice(electricObj, location);

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

        const sumOptionals = packsTotal + extraPacksTotal + electricPrice + additionalsTotal + customTotal;

        // All item prices (PVP) ALREADY include VAT.
        // Sum of all items is the PVP Total including VAT.
        const pvpTotal = basePrice + sumOptionals;

        // Apply discounts (cumulative: % first, then fixed)
        const discountPercentAmount = pvpTotal * (discountPercent / 100);
        // The total after discounts is our FINAL TOTAL with VAT.
        const total = Math.max(0, pvpTotal - discountPercentAmount - discountFixed);

        // Extract IVA from total (Reverse calculation)
        const { rate: ivaRate } = getRegionalIva(regionalConfigs, location);
        // Reverse calculation: Base = Total / (1 + Rate/100)
        const precioBase = total / (1 + (ivaRate / 100));
        const ivaAmount = total - precioBase;

        // IEDMT — fixed amounts from regional_config
        const { applies: iedmtApplies, autoAmount, manualAmount } = getRegionalIedmt(regionalConfigs, location);
        let iedmt = 0;
        if (iedmtApplies) {
            const engineName = engines.find(e => e.id === selectedEngine)?.name || '';
            iedmt = engineName.toLowerCase().includes('automático') ? autoAmount : manualAmount;
        }
        const totalWithIedmt = total + iedmt;

        return {
            basePrice,
            modelPrice,
            sumOptionals,
            pvpTotal,
            discountPercentAmount,
            totalAfterDiscounts: total, // Legacy support
            precioBase,
            ivaRate,
            ivaAmount,
            total,
            iedmt,
            totalWithIedmt,
            packsTotal,
            extraPacksTotal,
            electricPrice,
            additionalsTotal,
            customTotal,
        };
    }, [selectedModel, selectedEngine, selectedInteriorColor, selectedPacks,
        selectedExtraPacks, selectedElectric, selectedAdditionals, customItems, location,
        models, engines, interiorColors, packs, extraPacks, electricSystems, additionalItems,
        discountPercent, discountFixed, regionalConfigs, getElectricDiscountPrice]);

    // ── Save Handler ───────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!projectId) {
                // projectId is used as clientId in new flow
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
                total_with_iedmt: calculations.totalWithIedmt,
                discount_percentage: discountPercent / 100,
                discount_amount: discountFixed,
                discount_percentage_label: discountPercentLabel,
                discount_amount_label: discountFixedLabel,
                location: location,
                comunidad_autonoma: location === 'peninsula' ? comunidadAutonoma : null,
                iva_rate: calculations.ivaRate,
            };

            // Resolve the actual client_id from the projects table
            let resolvedClientId = projectId;
            let resolvedProjectId: string | null = null;
            if (projectId) {
                const { data: projectData } = await supabase
                    .from('projects')
                    .select('client_id')
                    .eq('id', projectId)
                    .maybeSingle() as { data: { client_id: string | null } | null };
                if (projectData?.client_id) {
                    resolvedClientId = projectData.client_id;
                    resolvedProjectId = projectId;
                }
            }

            // Si estamos editando un presupuesto existente, marcarlo como no primario
            // y copiar su project_id al nuevo presupuesto
            if (budgetId) {
                const { data: oldBudget } = await supabase
                    .from('budget')
                    .select('project_id')
                    .eq('id', budgetId)
                    .single() as { data: { project_id: string | null } | null };
                if (oldBudget?.project_id) {
                    resolvedProjectId = oldBudget.project_id;
                }

                await supabase
                    .from('budget')
                    .update({ is_primary: false })
                    .eq('id', budgetId);
            }

            // Siempre crear un nuevo presupuesto (histórico)
            const { data: newBudget, error: createError } = await supabase
                .from('budget')
                .insert({
                    client_id: resolvedClientId,
                    project_id: resolvedProjectId,
                    status: 'draft',
                    is_primary: true,
                    is_active: true,
                    ...budgetPayload,
                } as any)
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

            // Insert selected extra packs as budget items
            extraPacks.forEach((ep: any) => {
                if (selectedExtraPacks.has(ep.id)) {
                    const epPrice = getPrice(ep, location);
                    itemsToInsert.push({
                        budget_id: activeBudgetId,
                        concept_id: ep.id,
                        name: ep.name,
                        price: epPrice,
                        quantity: 1,
                        line_total: epPrice,
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
                    .from('budget_items')
                    .insert(itemsToInsert);
                if (itemsError) throw itemsError;
            }

            queryClient.invalidateQueries({ queryKey: ['project-budgets'] });
            queryClient.invalidateQueries({ queryKey: ['new-budgets'] });
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

    const locationLegalText: Record<Location, string[]> = {
        peninsula: getRegionalLegalText(regionalConfigs, 'peninsula').length > 0
            ? getRegionalLegalText(regionalConfigs, 'peninsula')
            : ['Precios con IVA (21%) incluido. IEDMT no incluido en el PVP, se calcula según la normativa vigente. Presupuesto válido 30 días.'],
        canarias: getRegionalLegalText(regionalConfigs, 'canarias').length > 0
            ? getRegionalLegalText(regionalConfigs, 'canarias')
            : ['Precios sin IVA. IEDMT incluido en el presupuesto. Gastos de transporte a Canarias no incluidos. Presupuesto válido 30 días.'],
        internacional: getRegionalLegalText(regionalConfigs, 'internacional').length > 0
            ? getRegionalLegalText(regionalConfigs, 'internacional')
            : ['Precios sin impuestos locales. Transporte internacional no incluido. Presupuesto válido 30 días.'],
    };

    // ── Build Print Data ────────────────────────────────────
    const buildPrintData = useCallback(async (): Promise<BudgetPrintData> => {
        // Use the clientName prop directly since projects no longer exists
        let printClientName = clientName || 'Cliente';
        let printClientEmail = '';
        let printClientPhone = '';

        // Fetch client email and phone from database
        if (projectId) {
            const { data: clientData } = await supabase
                .from('clients')
                .select('email, phone')
                .eq('id', projectId)
                .maybeSingle();
            if (clientData) {
                printClientEmail = clientData.email || '';
                printClientPhone = clientData.phone || '';
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

        // Extra Packs
        extraPacks.filter((ep: any) => selectedExtraPacks.has(ep.id)).forEach((ep: any) => {
            const epPrice = getPrice(ep, location);
            const epComponents = extraPackComponents
                .filter((c: any) => c.pack_extra_id === ep.id)
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((c: any) => c.name);
            lineItems.push({
                name: 'Extra Pack',
                subtitle: ep.name,
                quantity: 1,
                unitPrice: epPrice,
                total: epPrice,
                subItems: epComponents.length > 0 ? epComponents : undefined,
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
            discountPercentLabel: discountPercentLabel,
            discountFixed: discountFixed,
            discountFixedLabel: discountFixedLabel,
            ivaRate: calculations.ivaRate,
            ivaAmount: calculations.ivaAmount,
            total: calculations.total,
            iedmt: calculations.iedmt,
            totalWithIedmt: calculations.totalWithIedmt,
        };
    }, [budgetCode, location, clientName, projectId, selectedModel, selectedEngine,
        selectedInteriorColor, selectedElectric, selectedPacks, selectedExtraPacks,
        selectedAdditionals, customItems, models, engines, interiorColors, packs,
        extraPacks, extraPackComponents, electricSystems, additionalItems, calculations]);

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
                                            bgColor="#2E7D6F"
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

                            {/* Extra Packs */}
                            {extraPacks.length > 0 && (
                                <>
                                    <div style={{ paddingTop: '1.5rem', paddingBottom: '0.75rem' }}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-5 bg-[#E8734A] rounded-full" />
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Extra Packs</h3>
                                        </div>
                                    </div>
                                    {[...extraPacks].sort((a: any, b: any) => a.order_index - b.order_index).map((ep: any) => {
                                        const epComponents = extraPackComponents
                                            .filter((c: any) => c.pack_extra_id === ep.id)
                                            .sort((a: any, b: any) => a.order_index - b.order_index);

                                        // Space Pack solo disponible con modelos Space
                                        const isSpacePack = ep.name?.toLowerCase().includes('space');
                                        const selectedModelObj = models.find(m => m.id === selectedModel);
                                        const isSpaceModel = selectedModelObj?.name?.toLowerCase().includes('space') || false;
                                        const isDisabled = isSpacePack && !isSpaceModel;

                                        return (
                                            <div key={ep.id} className={`bg-white rounded-lg border border-[#E5E7EB] overflow-hidden mb-3 shadow-sm ${isDisabled ? 'opacity-50' : ''}`}>
                                                <SectionHeader
                                                    title={isDisabled ? `${ep.name} (solo modelos Space)` : ep.name}
                                                    price={getPrice(ep, location)}
                                                    checked={selectedExtraPacks.has(ep.id)}
                                                    onCheck={isDisabled ? undefined : () => {
                                                        setSelectedExtraPacks(prev => {
                                                            const next = new Set(prev);
                                                            next.has(ep.id) ? next.delete(ep.id) : next.add(ep.id);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                                {epComponents.length > 0 && (
                                                    <div className="px-4 py-2.5 border-t border-[#F3F4F6] bg-[#FAFBFC]">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">Incluye:</p>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                            {epComponents.map((comp: any) => (
                                                                <div key={comp.id} className="flex items-center gap-1.5">
                                                                    <div className="w-1 h-1 rounded-full bg-[#C59D5F]/40 flex-shrink-0" />
                                                                    <span className="text-[11px] text-[#6B7280]">{comp.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* Individual Optionals — only items NOT out_of_offer */}
                            {additionalItems.filter((item: any) => !item.out_of_offer).length > 0 && (
                                <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden mb-3 shadow-sm">
                                    <SectionHeader title="Opcionales Individuales" bgColor="#2E7D6F" />
                                    {additionalItems
                                        .filter((item: any) => !item.out_of_offer)
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
                                        price={getElectricDiscountPrice(sys, location)}
                                        checked={selectedElectric === sys.id}
                                        onCheck={() => setSelectedElectric(
                                            selectedElectric === sys.id ? null : sys.id
                                        )}
                                        isRadio
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ── FUERA DE CARTA ─────────── */}
                        <div className="space-y-0">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-[#E8734A] rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Fuera de Carta</h3>
                            </div>

                            <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden shadow-sm">
                                <SectionHeader title="Fuera de Carta" bgColor="#2E7D6F" />

                                {/* Search input */}
                                <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-[#FAFBFC]">
                                    <div
                                        className={`flex items-center gap-2 bg-white rounded-lg border px-3 py-2 cursor-text transition-colors ${outOfOfferOpen ? 'border-[#2E7D6F] ring-1 ring-[#2E7D6F]/20' : 'border-[#E5E7EB]'
                                            }`}
                                        onClick={() => setOutOfOfferOpen(true)}
                                    >
                                        <Search className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={outOfOfferSearch}
                                            onChange={(e) => { setOutOfOfferSearch(e.target.value); setOutOfOfferOpen(true); }}
                                            onFocus={() => setOutOfOfferOpen(true)}
                                            placeholder="Buscar ítems fuera de carta..."
                                            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-[#CBD5E1]"
                                        />
                                        {(outOfOfferSearch || outOfOfferOpen) && (
                                            <button onClick={(e) => { e.stopPropagation(); setOutOfOfferSearch(''); setOutOfOfferOpen(false); }} className="text-[#9CA3AF] hover:text-[#4B5563]">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Out-of-offer items from DB — visible when search is open or item is selected */}
                                {additionalItems
                                    .filter((item: any) => item.out_of_offer)
                                    .filter((item: any) => {
                                        // Always show already-selected items
                                        if (selectedAdditionals.has(item.id)) return true;
                                        // Only show unselected items when search is open
                                        if (!outOfOfferOpen) return false;
                                        if (!outOfOfferSearch.trim()) return true;
                                        return item.name?.toLowerCase().includes(outOfOfferSearch.toLowerCase());
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

                                {/* Separator between DB items and custom items */}
                                <div className="px-4 py-1.5 bg-[#F8F9FA] border-t border-b border-[#E5E7EB]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Conceptos personalizados</p>
                                </div>

                                {/* Custom items (free-text) */}
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
                                    <div className="px-3 py-2 space-y-2">
                                        <input
                                            type="text"
                                            value={discountPercentLabel}
                                            onChange={(e) => setDiscountPercentLabel(e.target.value)}
                                            placeholder="Ej: Descuento feria"
                                            className="w-full text-xs bg-transparent border-none outline-none placeholder:text-[#CBD5E1] text-[#6B7280]"
                                        />
                                        <div className="flex items-center">
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
                                    <div className="px-3 py-2 space-y-2">
                                        <input
                                            type="text"
                                            value={discountFixedLabel}
                                            onChange={(e) => setDiscountFixedLabel(e.target.value)}
                                            placeholder="Ej: Descuento feria"
                                            className="w-full text-xs bg-transparent border-none outline-none placeholder:text-[#CBD5E1] text-[#6B7280]"
                                        />
                                        <div className="flex items-center">
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
                        </div>

                        {/* ── Legal Footer Text ────────── */}
                        <div className="pt-4 pb-8">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#374151] mb-2">
                                Condiciones Generales
                            </p>
                            <div className="space-y-1.5">
                                {locationLegalText[location].map((text, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-[#CBD5E1] mt-1.5 flex-shrink-0" />
                                        <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-[#CBD5E1] mt-2">
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
                                {calculations.sumOptionals > 0 && (
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

                                        {/* Extra Packs */}
                                        {extraPacks.filter((ep: any) => selectedExtraPacks.has(ep.id)).map((ep: any) => {
                                            const epComponents = extraPackComponents
                                                .filter((c: any) => c.pack_extra_id === ep.id)
                                                .sort((a: any, b: any) => a.order_index - b.order_index);
                                            return (
                                                <div key={ep.id}>
                                                    <div className="flex justify-between">
                                                        <p className="text-xs text-[#4B5563] truncate pr-2">{ep.name}</p>
                                                        <p className="text-xs font-medium tabular-nums whitespace-nowrap">{fmt(getPrice(ep, location))} €</p>
                                                    </div>
                                                    {epComponents.length > 0 && (
                                                        <div className="ml-2 mt-0.5 mb-1 space-y-0.5">
                                                            {epComponents.map((comp: any) => (
                                                                <div key={comp.id} className="flex items-center gap-1.5">
                                                                    <div className="w-0.5 h-0.5 rounded-full bg-[#C59D5F]/40 flex-shrink-0" />
                                                                    <span className="text-[10px] text-[#9CA3AF]">{comp.name}</span>
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
                                            <p className="text-xs font-bold tabular-nums">{fmt(calculations.sumOptionals)} €</p>
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
                                        <span>{discountPercentLabel ? `${discountPercentLabel} (${discountPercent}%)` : `Dto. ${discountPercent}%`}</span>
                                        <span className="font-bold tabular-nums">-{fmtDecimal(calculations.discountPercentAmount)} €</span>
                                    </div>
                                )}
                                {discountFixed > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 italic">
                                        <span>{discountFixedLabel || 'Dto. fijo'}</span>
                                        <span className="font-bold tabular-nums">-{fmtDecimal(discountFixed)} €</span>
                                    </div>
                                )}

                                {/* PVP with discounts applied - This is our Total with IVA */}
                                <div className="flex justify-between items-center bg-[#F3F4F6] -mx-6 px-6 py-2.5">
                                    <p className="text-xs font-semibold uppercase text-[#6B7280]">Precio Total</p>
                                    <p className="text-sm font-bold text-[#E8734A] tabular-nums">
                                        {fmtDecimal(calculations.total)} €
                                    </p>
                                </div>

                                {/* Tax breakdown */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#9CA3AF]">Precio base</span>
                                        <span className="tabular-nums">{fmtDecimal(calculations.precioBase)} €</span>
                                    </div>
                                    {location !== 'internacional' && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#9CA3AF]">
                                                IVA ({calculations.ivaRate}%)
                                            </span>
                                            <span className="tabular-nums">{fmtDecimal(calculations.ivaAmount)} €</span>
                                        </div>
                                    )}
                                    <Separator className="bg-[#E5E7EB] my-2" />

                                    {location !== 'internacional' && (
                                        <>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[#9CA3AF]">+IEDMT</span>
                                                <span className="tabular-nums">{fmtDecimal(calculations.iedmt)} €</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-gradient-to-r from-[#2C3E50] to-[#34495E] -mx-6 px-6 py-4 rounded-xl mt-3 shadow-lg">
                                                <span className="text-white font-bold text-sm uppercase tracking-wider">Total + IEDMT</span>
                                                <span className="text-[#C59D5F] font-black text-2xl tabular-nums">
                                                    {fmtDecimal(calculations.totalWithIedmt)} €
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {location === 'internacional' && (
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
                    legalTexts={locationLegalText[location]}
                />
            </DialogContent>
        </Dialog>
    );
};

export default BudgetEditorModal;
