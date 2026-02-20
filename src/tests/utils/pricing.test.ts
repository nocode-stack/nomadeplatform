import { describe, it, expect } from 'vitest';
import { calculateBudgetTotal, BASE_PRICES } from '../../utils/pricing';

describe('pricing utility: calculateBudgetTotal', () => {
    it('should calculate base price correctly for a standard model', () => {
        const data = {
            vehicleModel: 'Neo',
            motorization: 'Diesel 140cv',
            electricalSystem: 'Básico',
            extraPacks: 'Pack Nomade'
        };
        const result = calculateBudgetTotal(data);

        // Neo (45000) + Diesel 140 (0) + Básico (0) + Pack Nomade (1500) = 46500
        // IVA 21% = 46500 * 1.21 = 56265
        expect(result.subtotal).toBe(46500);
        expect(result.total).toBe(56265);
    });

    it('should apply discount as a number correctly', () => {
        const data = {
            vehicleModel: 'Neo S',
            discount: 10 // 10%
        };
        const result = calculateBudgetTotal(data);

        // Neo S (52000)
        // Discount 10% = 5200
        // Subtotal after discount = 46800
        // Total with 21% IVA = 46800 * 1.21 = 56628
        expect(result.subtotal).toBe(52000);
        expect(result.discountAmount).toBe(5200);
        expect(result.total).toBe(56628);
    });

    it('should apply discount as a string with comma correctly', () => {
        const data = {
            vehicleModel: 'Neo XL',
            discount: '5,5' // 5.5%
        };
        const result = calculateBudgetTotal(data);

        // Neo XL (65000)
        // Discount 5.5% = 3575
        // Subtotal after = 61425
        // Total with IVA = 61425 * 1.21 = 74324.25
        expect(result.subtotal).toBe(65000);
        expect(result.discountAmount).toBe(3575);
        expect(result.total).toBe(74324.25);
    });

    it('should handle custom prices provided in the prices object', () => {
        const data = {
            prices: {
                model: 40000,
                engine: 2000,
                electric: 1000,
                exterior: 500
            }
        };
        const result = calculateBudgetTotal(data);

        // 40000 + 2000 + 1000 + 500 = 43500
        // With 21% IVA = 43500 * 1.21 = 52635
        expect(result.subtotal).toBe(43500);
        expect(result.total).toBe(52635);
    });

    it('should handle additional items correctly', () => {
        const data = {
            vehicleModel: 'Neo',
            items: [
                { price: 100, quantity: 2 },
                { price: 500, quantity: 1 }
            ]
        };
        const result = calculateBudgetTotal(data);

        // Neo (45000) + (100*2) + 500 = 45700
        expect(result.subtotal).toBe(45700);
    });

    it('should handle custom IVA rate', () => {
        const data = {
            vehicleModel: 'Neo',
            ivaRate: 10
        } as any; // Cast because ivaRate is not in the explicit type but used in code

        const result = calculateBudgetTotal(data);

        // Neo (45000) * 1.10 = 49500
        expect(result.total).toBe(49500);
    });

    it('should be resilient to missing data', () => {
        const result = calculateBudgetTotal({});
        expect(result.subtotal).toBe(0);
        expect(result.discountAmount).toBe(0);
        expect(result.total).toBe(0);
    });

    it('should be resilient to invalid numeric inputs in discount', () => {
        const data = {
            vehicleModel: 'Neo',
            discount: 'invalid'
        };
        const result = calculateBudgetTotal(data);
        expect(result.discountAmount).toBe(0);
        expect(result.total).toBe(54450); // 45000 * 1.21
    });
});
