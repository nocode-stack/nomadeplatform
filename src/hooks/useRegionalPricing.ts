import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────
export type Location = 'peninsula' | 'canarias' | 'internacional';

export interface RegionalConfig {
    id: string;
    location: string;
    iva_rate: number;
    iva_label: string;
    iedmt_rate: number;
    iedmt_applies: boolean;
    iedmt_auto_amount: number;
    iedmt_manual_amount: number;
    legal_text: string;
    legal_text_extra: string | null;
    budget_footer: string | null;
    currency: string;
    created_at: string;
    updated_at: string;
}

// ── Hook: fetch regional_config ────────────────────────────
export const useRegionalConfig = () => {
    return useQuery({
        queryKey: ['regional-config'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('regional_config')
                .select('*')
                .order('location');

            if (error) throw error;
            return data as RegionalConfig[];
        },
        staleTime: 1000 * 60 * 30, // Cache 30 min (rarely changes)
    });
};

// ── Helper: pick the right price based on location ─────────
// For items with price_modifier (models, engines, colors):
//   peninsula → price_modifier
//   canarias/internacional → price_export
//
// For items with price (packs, electric, additionals):
//   peninsula → price
//   canarias/internacional → price_export
export const getPrice = (item: any, location: Location): number => {
    if (!item) return 0;

    if (location === 'peninsula') {
        // Use the standard price column
        return item.price_modifier ?? item.price ?? 0;
    }

    // For canarias & internacional, use price_export (fallback to standard)
    const exportPrice = item.price_export;
    if (exportPrice != null && exportPrice !== undefined) {
        return Number(exportPrice);
    }
    // Fallback to standard price if price_export not set
    return item.price_modifier ?? item.price ?? 0;
};

// ── Helper: get IVA config for location ────────────────────
export const getRegionalIva = (
    configs: RegionalConfig[] | undefined,
    location: Location
): { rate: number; label: string } => {
    const config = configs?.find(c => c.location === location);
    if (config) {
        return { rate: config.iva_rate, label: config.iva_label };
    }
    // Fallback hardcoded
    switch (location) {
        case 'canarias': return { rate: 0, label: 'IVA' };
        case 'internacional': return { rate: 0, label: 'Sin impuestos' };
        default: return { rate: 21, label: 'IVA' };
    }
};

// ── Helper: get IEDMT config for location ──────────────────
export const getRegionalIedmt = (
    configs: RegionalConfig[] | undefined,
    location: Location
): { applies: boolean; autoAmount: number; manualAmount: number } => {
    const config = configs?.find(c => c.location === location);
    if (config) {
        return {
            applies: config.iedmt_applies,
            autoAmount: Number(config.iedmt_auto_amount) || 0,
            manualAmount: Number(config.iedmt_manual_amount) || 0,
        };
    }
    // Fallback
    const applies = location !== 'internacional';
    return {
        applies,
        autoAmount: applies ? 4600 : 0,
        manualAmount: applies ? 4300 : 0,
    };
};

// ── Helper: get legal text for location ────────────────────
export const getRegionalLegalText = (
    configs: RegionalConfig[] | undefined,
    location: Location
): string[] => {
    const config = configs?.find(c => c.location === location);
    if (!config) return [];
    const texts: string[] = [];
    if (config.legal_text) texts.push(config.legal_text);
    if (config.legal_text_extra) texts.push(config.legal_text_extra);
    return texts;
};
