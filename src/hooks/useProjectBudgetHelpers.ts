import { supabase } from '@/integrations/supabase/client';
import { BudgetItemInput } from '@/types/project';
import { calculateBudgetTotal } from '@/utils/pricing';

/** Budget option types returned from the database */
export interface BudgetOption {
    id: string;
    name: string;
    price_modifier?: number;
    price?: number;
}

export interface BudgetOptions {
    models: BudgetOption[] | null;
    engines: BudgetOption[] | null;
    exteriorColors: BudgetOption[] | null;
    interiorColors: BudgetOption[] | null;
    packs: BudgetOption[] | null;
    electricSystems: BudgetOption[] | null;
}

/** Fetch all budget configuration options in parallel */
export async function fetchBudgetOptions(): Promise<BudgetOptions> {
    const [
        { data: models },
        { data: engines },
        { data: exteriorColors },
        { data: interiorColors },
        { data: packs },
        { data: electricSystems }
    ] = await Promise.all([
        supabase.from('model_options').select('id, name, price_modifier').eq('is_active', true),
        supabase.from('engine_options').select('id, name, price_modifier').eq('is_active', true),
        supabase.from('exterior_color_options').select('id, name, price_modifier').eq('is_active', true),
        supabase.from('interior_color_options').select('id, name, price_modifier').eq('is_active', true),
        supabase.from('NEW_Budget_Packs').select('id, name, price').eq('is_active', true),
        supabase.from('NEW_Budget_Electric').select('id, name, price').eq('is_active', true)
    ]);

    return { models, engines, exteriorColors, interiorColors, packs, electricSystems };
}

/** Find an option ID by name (case-insensitive, trimmed) */
export function findOptionId(options: BudgetOption[] | null, name: string | undefined | null): string | null {
    if (!name) return null;
    const normalizedName = name.trim().toLowerCase();
    return options?.find(o => o.name?.trim().toLowerCase() === normalizedName)?.id || null;
}

/** Parse a value to a safe float, returns 0 for invalid input */
export function safeFloat(val: string | number | null | undefined): number {
    if (val === null || val === undefined || val === '') return 0;
    const parsed = parseFloat(String(val));
    const result = isNaN(parsed) ? 0 : parsed;
    return Math.round(result * 100) / 100;
}

/** Build budget item insert data from form items */
export function buildBudgetItems(budgetId: string, items: BudgetItemInput[]) {
    return items.map(item => ({
        budget_id: budgetId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        line_total: Math.round(item.price * item.quantity * 100) / 100,
        is_custom: item.is_custom || false,
        is_discount: false
    }));
}

/** Calculate budget totals from form data and options */
export function calculateFromOptions(
    opts: BudgetOptions,
    formData: {
        vehicleModel?: string;
        motorization?: string;
        electricalSystem?: string;
        extraPacks?: string;
        exteriorColor?: string;
        furnitureColor?: string;
        discount?: string | number;
        items?: BudgetItemInput[];
    }
) {
    return calculateBudgetTotal({
        vehicleModel: formData.vehicleModel,
        motorization: formData.motorization,
        electricalSystem: formData.electricalSystem,
        extraPacks: formData.extraPacks,
        discount: formData.discount,
        items: formData.items || [],
        prices: {
            model: opts.models?.find(m => m.name === formData.vehicleModel)?.price_modifier,
            engine: opts.engines?.find(e => e.name === formData.motorization)?.price_modifier,
            electric: opts.electricSystems?.find(es => es.name === formData.electricalSystem)?.price,
            pack: opts.packs?.find(p => p.name === formData.extraPacks)?.price,
            exterior: opts.exteriorColors?.find(ec => ec.name === formData.exteriorColor)?.price_modifier,
            interior: opts.interiorColors?.find(ic => ic.name === formData.furnitureColor)?.price_modifier
        }
    });
}
