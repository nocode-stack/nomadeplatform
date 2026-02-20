import { describe, it, expect } from 'vitest';

/**
 * Pure unit tests for budget discount calculation logic.
 * Mirrors the calculation done in BudgetEditorModal useMemo.
 *
 * Logic:
 *   1. PVP Total = base + optionals
 *   2. discountPercentAmount = PVP Total × (discountPercent / 100)
 *   3. totalAfterDiscounts = max(0, PVP Total − discountPercentAmount − discountFixed)
 *   4. IVA/IGIC is applied on totalAfterDiscounts
 *   5. IEDMT (peninsula only) is applied on totalAfterDiscounts
 */

interface CalcInput {
    pvpTotal: number;
    discountPercent: number;
    discountFixed: number;
    ivaRate: number;
    location: 'peninsula' | 'canarias' | 'internacional';
}

interface CalcResult {
    pvpTotal: number;
    discountPercentAmount: number;
    totalAfterDiscounts: number;
    precioBase: number;
    ivaAmount: number;
    total: number;
    iedmt: number;
    totalWithIedmt: number;
}

// Replicates the exact calculation logic from BudgetEditorModal
function calculateWithDiscounts(input: CalcInput): CalcResult {
    const { pvpTotal, discountPercent, discountFixed, ivaRate, location } = input;

    const discountPercentAmount = pvpTotal * (discountPercent / 100);
    const totalAfterDiscounts = Math.max(0, pvpTotal - discountPercentAmount - discountFixed);

    const precioBase = totalAfterDiscounts / (1 + ivaRate / 100);
    const ivaAmount = totalAfterDiscounts - precioBase;
    const total = totalAfterDiscounts;

    const iedmt = location === 'peninsula' ? Math.round(totalAfterDiscounts * 0.0475) : 0;
    const totalWithIedmt = total + iedmt;

    return {
        pvpTotal,
        discountPercentAmount,
        totalAfterDiscounts,
        precioBase,
        ivaAmount,
        total,
        iedmt,
        totalWithIedmt,
    };
}

describe('Budget Discount Calculations', () => {

    // ── Solo descuento porcentual ─────────────────────────
    describe('Percentage discount only', () => {
        it('should apply 10% discount correctly on peninsula', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 10,
                discountFixed: 0,
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.discountPercentAmount).toBe(5000);
            expect(result.totalAfterDiscounts).toBe(45000);
            expect(result.total).toBe(45000);
            // IVA: 45000 - (45000 / 1.21) ≈ 7809.92
            expect(result.precioBase).toBeCloseTo(37190.08, 0);
            expect(result.ivaAmount).toBeCloseTo(7809.92, 0);
            // IEDMT: 45000 * 0.0475 = 2137.5 → rounded = 2138
            expect(result.iedmt).toBe(Math.round(45000 * 0.0475));
        });

        it('should apply 5.5% discount on Canarias with IGIC', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 60000,
                discountPercent: 5.5,
                discountFixed: 0,
                ivaRate: 7,
                location: 'canarias',
            });

            expect(result.discountPercentAmount).toBe(3300); // 60000 * 0.055
            expect(result.totalAfterDiscounts).toBe(56700);
            // No IEDMT in Canarias
            expect(result.iedmt).toBe(0);
            expect(result.totalWithIedmt).toBe(56700);
        });

        it('should handle 0% discount (no change)', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 45000,
                discountPercent: 0,
                discountFixed: 0,
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.discountPercentAmount).toBe(0);
            expect(result.totalAfterDiscounts).toBe(45000);
            expect(result.total).toBe(45000);
        });

        it('should handle 100% discount (free)', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 100,
                discountFixed: 0,
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.discountPercentAmount).toBe(50000);
            expect(result.totalAfterDiscounts).toBe(0);
            expect(result.total).toBe(0);
            expect(result.iedmt).toBe(0);
        });
    });

    // ── Solo descuento fijo ───────────────────────────────
    describe('Fixed discount only', () => {
        it('should apply fixed 2000€ discount', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 0,
                discountFixed: 2000,
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.discountPercentAmount).toBe(0);
            expect(result.totalAfterDiscounts).toBe(48000);
            expect(result.total).toBe(48000);
        });

        it('should not go below 0 with a large fixed discount', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 1000,
                discountPercent: 0,
                discountFixed: 5000,
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.totalAfterDiscounts).toBe(0);
            expect(result.total).toBe(0);
        });
    });

    // ── Descuentos acumulados ─────────────────────────────
    describe('Cumulative discounts (% + €)', () => {
        it('should apply percentage first, then fixed', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 10, // -5000 → 45000
                discountFixed: 500,  // -500 → 44500
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.discountPercentAmount).toBe(5000);
            expect(result.totalAfterDiscounts).toBe(44500);
            expect(result.total).toBe(44500);
        });

        it('should clamp to 0 when both discounts exceed PVP', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 10000,
                discountPercent: 80, // -8000 → 2000
                discountFixed: 5000, // -5000 → would be -3000, clamped to 0
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.discountPercentAmount).toBe(8000);
            expect(result.totalAfterDiscounts).toBe(0);
        });

        it('should calculate tax on discounted total, not original', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 60000,
                discountPercent: 10,  // -6000 → 54000
                discountFixed: 1000,   // -1000 → 53000
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.totalAfterDiscounts).toBe(53000);
            // precioBase = 53000 / 1.21 ≈ 43801.65
            expect(result.precioBase).toBeCloseTo(43801.65, 0);
            expect(result.ivaAmount).toBeCloseTo(9198.35, 0);
            // IEDMT on 53000, not on 60000
            expect(result.iedmt).toBe(Math.round(53000 * 0.0475));
        });
    });

    // ── Location-specific ────────────────────────────────
    describe('Location-specific behavior', () => {
        it('should have no IEDMT for Canarias', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 5,
                discountFixed: 0,
                ivaRate: 7,
                location: 'canarias',
            });

            expect(result.iedmt).toBe(0);
            expect(result.totalWithIedmt).toBe(result.total);
        });

        it('should have no IEDMT for Internacional', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 0,
                discountFixed: 1000,
                ivaRate: 0,
                location: 'internacional',
            });

            expect(result.iedmt).toBe(0);
            expect(result.totalAfterDiscounts).toBe(49000);
        });

        it('should have IEDMT only for Península', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 0,
                discountFixed: 0,
                ivaRate: 21,
                location: 'peninsula',
            });

            expect(result.iedmt).toBe(Math.round(50000 * 0.0475));
            expect(result.totalWithIedmt).toBe(50000 + result.iedmt);
        });
    });
});
