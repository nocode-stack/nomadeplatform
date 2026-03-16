import { describe, it, expect, vi } from 'vitest';

// Mock supabase client to prevent env var crash in CI
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import { getPrice, getRegionalIva, getRegionalIedmt, getRegionalLegalText, RegionalConfig } from '../../hooks/useRegionalPricing';

const mockConfigs: RegionalConfig[] = [
    {
        id: '1',
        location: 'peninsula',
        iva_rate: 21,
        iva_label: 'IVA',
        iedmt_rate: 0,
        iedmt_applies: true,
        iedmt_auto_amount: 4600,
        iedmt_manual_amount: 4300,
        legal_text: 'Precio con IVA incluido',
        legal_text_extra: 'Sujeto a condiciones',
        budget_footer: 'Presupuesto válido 30 días',
        currency: 'EUR',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    },
    {
        id: '2',
        location: 'canarias',
        iva_rate: 0,
        iva_label: 'IGIC',
        iedmt_rate: 0,
        iedmt_applies: false,
        iedmt_auto_amount: 0,
        iedmt_manual_amount: 0,
        legal_text: 'Precio sin IGIC',
        legal_text_extra: null,
        budget_footer: null,
        currency: 'EUR',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    },
    {
        id: '3',
        location: 'internacional',
        iva_rate: 0,
        iva_label: 'Sin impuestos',
        iedmt_rate: 0,
        iedmt_applies: false,
        iedmt_auto_amount: 0,
        iedmt_manual_amount: 0,
        legal_text: 'Export price',
        legal_text_extra: null,
        budget_footer: null,
        currency: 'EUR',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    },
];

describe('getPrice', () => {
    it('should return price_modifier for peninsula items', () => {
        const item = { price_modifier: 45000, price_export: 40000 };
        expect(getPrice(item, 'peninsula')).toBe(45000);
    });

    it('should return price for peninsula when no price_modifier', () => {
        const item = { price: 5000, price_export: 4500 };
        expect(getPrice(item, 'peninsula')).toBe(5000);
    });

    it('should return price_export for canarias', () => {
        const item = { price_modifier: 45000, price_export: 40000 };
        expect(getPrice(item, 'canarias')).toBe(40000);
    });

    it('should return price_export for internacional', () => {
        const item = { price: 5000, price_export: 3000 };
        expect(getPrice(item, 'internacional')).toBe(3000);
    });

    it('should fallback to standard price when no price_export', () => {
        const item = { price_modifier: 45000 };
        expect(getPrice(item, 'canarias')).toBe(45000);
    });

    it('should return 0 for null/undefined item', () => {
        expect(getPrice(null, 'peninsula')).toBe(0);
        expect(getPrice(undefined, 'peninsula')).toBe(0);
    });
});

describe('getRegionalIva', () => {
    it('should return IVA 21% for peninsula', () => {
        const result = getRegionalIva(mockConfigs, 'peninsula');
        expect(result.rate).toBe(21);
        expect(result.label).toBe('IVA');
    });

    it('should return 0% for canarias (IGIC)', () => {
        const result = getRegionalIva(mockConfigs, 'canarias');
        expect(result.rate).toBe(0);
        expect(result.label).toBe('IGIC');
    });

    it('should return 0% for internacional', () => {
        const result = getRegionalIva(mockConfigs, 'internacional');
        expect(result.rate).toBe(0);
        expect(result.label).toBe('Sin impuestos');
    });

    it('should fallback to 21% IVA when no config found', () => {
        const result = getRegionalIva(undefined, 'peninsula');
        expect(result.rate).toBe(21);
    });

    it('should fallback to 0 for canarias without config', () => {
        const result = getRegionalIva(undefined, 'canarias');
        expect(result.rate).toBe(0);
    });
});

describe('getRegionalIedmt', () => {
    it('should return IEDMT amounts for peninsula', () => {
        const result = getRegionalIedmt(mockConfigs, 'peninsula');
        expect(result.applies).toBe(true);
        expect(result.autoAmount).toBe(4600);
        expect(result.manualAmount).toBe(4300);
    });

    it('should not apply IEDMT for canarias', () => {
        const result = getRegionalIedmt(mockConfigs, 'canarias');
        expect(result.applies).toBe(false);
        expect(result.autoAmount).toBe(0);
    });

    it('should not apply IEDMT for internacional', () => {
        const result = getRegionalIedmt(mockConfigs, 'internacional');
        expect(result.applies).toBe(false);
    });

    it('should fallback correctly when no config', () => {
        const pen = getRegionalIedmt(undefined, 'peninsula');
        expect(pen.applies).toBe(true);
        expect(pen.autoAmount).toBe(4600);

        const int = getRegionalIedmt(undefined, 'internacional');
        expect(int.applies).toBe(false);
    });
});

describe('getRegionalLegalText', () => {
    it('should return legal texts for peninsula', () => {
        const texts = getRegionalLegalText(mockConfigs, 'peninsula');
        expect(texts).toContain('Precio con IVA incluido');
        expect(texts).toContain('Sujeto a condiciones');
        expect(texts).toHaveLength(2);
    });

    it('should return only main text for canarias (no extra)', () => {
        const texts = getRegionalLegalText(mockConfigs, 'canarias');
        expect(texts).toContain('Precio sin IGIC');
        expect(texts).toHaveLength(1);
    });

    it('should return empty array when no config found', () => {
        const texts = getRegionalLegalText(undefined, 'peninsula');
        expect(texts).toEqual([]);
    });
});
