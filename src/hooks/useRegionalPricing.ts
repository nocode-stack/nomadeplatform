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
    legal_text: string;
    transport_note: string;
    created_at: string;
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
        case 'canarias': return { rate: 7, label: 'IGIC' };
        case 'internacional': return { rate: 0, label: 'Sin impuestos' };
        default: return { rate: 21, label: 'IVA' };
    }
};

// ── Helper: get IEDMT config for location ──────────────────
export const getRegionalIedmt = (
    configs: RegionalConfig[] | undefined,
    location: Location
): { rate: number; applies: boolean } => {
    const config = configs?.find(c => c.location === location);
    if (config) {
        return { rate: config.iedmt_rate, applies: config.iedmt_applies };
    }
    // Fallback
    return {
        rate: location === 'peninsula' ? 4.75 : 0,
        applies: location === 'peninsula',
    };
};

// ── Helper: get legal text for location ────────────────────
export const getRegionalLegalText = (
    configs: RegionalConfig[] | undefined,
    location: Location
): string => {
    const config = configs?.find(c => c.location === location);
    return config?.legal_text || '';
};
