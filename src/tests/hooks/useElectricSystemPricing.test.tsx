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

import { calculateElectricSystemPrice } from '../../hooks/useElectricSystemPricing';

describe('calculateElectricSystemPrice', () => {
    it('should return original price when no rules provided', () => {
        const result = calculateElectricSystemPrice(3000, null);

        expect(result.finalPrice).toBe(3000);
        expect(result.originalPrice).toBe(3000);
        expect(result.discountAmount).toBe(0);
        expect(result.isFree).toBe(false);
        expect(result.discountReason).toBeNull();
    });

    it('should return free pricing when pack rule is "free"', () => {
        const rules = {
            'Adventure': { type: 'free', amount: 0, reason: 'Incluido en pack Adventure' },
        };

        const result = calculateElectricSystemPrice(3000, rules, undefined, 'Adventure');

        expect(result.finalPrice).toBe(0);
        expect(result.originalPrice).toBe(3000);
        expect(result.discountAmount).toBe(3000);
        expect(result.isFree).toBe(true);
        expect(result.discountReason).toBe('Incluido en pack Adventure');
    });

    it('should apply discount when pack rule is "discount"', () => {
        const rules = {
            'Essentials': { type: 'discount', amount: 1000, reason: 'Descuento Essentials' },
        };

        const result = calculateElectricSystemPrice(3000, rules, undefined, 'Essentials');

        expect(result.finalPrice).toBe(2000);
        expect(result.originalPrice).toBe(3000);
        expect(result.discountAmount).toBe(1000);
        expect(result.isFree).toBe(false);
        expect(result.discountReason).toBe('Descuento Essentials');
    });

    it('should apply fixed price when pack rule is "fixed_price"', () => {
        const rules = {
            'Ultimate': { type: 'fixed_price', amount: 500, reason: 'Precio especial Ultimate' },
        };

        const result = calculateElectricSystemPrice(3000, rules, undefined, 'Ultimate');

        expect(result.finalPrice).toBe(500);
        expect(result.originalPrice).toBe(3000);
        expect(result.discountAmount).toBe(2500);
        expect(result.isFree).toBe(false);
        expect(result.discountReason).toBe('Precio especial Ultimate');
    });

    it('should match by pack_id when both packId and packName provided', () => {
        const rules = {
            'pack-id-1': { type: 'free', amount: 0, reason: 'Matched by ID' },
            'Adventure': { type: 'discount', amount: 500, reason: 'Matched by name' },
        };

        const result = calculateElectricSystemPrice(3000, rules, 'pack-id-1', 'Adventure');

        // Should match by packId first
        expect(result.isFree).toBe(true);
        expect(result.discountReason).toBe('Matched by ID');
    });

    it('should handle "Pack " prefix in pack name with fallback', () => {
        const rules = {
            'Ultimate': { type: 'free', amount: 0, reason: 'Incluido' },
        };

        const result = calculateElectricSystemPrice(3000, rules, undefined, 'Pack Ultimate');

        expect(result.isFree).toBe(true);
        expect(result.discountReason).toBe('Incluido');
    });

    it('should not go below zero for discount', () => {
        const rules = {
            'Big': { type: 'discount', amount: 10000, reason: 'Huge discount' },
        };

        const result = calculateElectricSystemPrice(3000, rules, undefined, 'Big');

        expect(result.finalPrice).toBe(0);
        expect(result.discountAmount).toBe(10000);
    });

    it('should return zero pricing when systemPrice is 0', () => {
        const result = calculateElectricSystemPrice(0, null);

        expect(result.finalPrice).toBe(0);
        expect(result.originalPrice).toBe(0);
    });

    it('should use default reason when rule has no reason', () => {
        const rules = {
            'Adventure': { type: 'free', amount: 0 },
        };

        const result = calculateElectricSystemPrice(3000, rules, undefined, 'Adventure');

        expect(result.discountReason).toBe('Incluido en pack');
    });
});
