import { describe, it, expect } from 'vitest';

/**
 * Pure unit tests for budget discount calculation logic.
 * Mirrors the calculation done in BudgetEditorModal useMemo.
 *
 * Logic:
 *   1. PVP Total = base + optionals
 *   2. discountPercentAmount = PVP Total × (discountPercent / 100)
 *   3. totalAfterDiscounts = max(0, PVP Total − discountPercentAmount − discountFixed)
 *   4. precioBase = totalAfterDiscounts (prices are NET)
 *   5. ivaAmount = totalAfterDiscounts × (ivaRate / 100)  — added ON TOP
 *   6. total = totalAfterDiscounts + ivaAmount
 *   7. IEDMT (peninsula + canarias) = fixed amount based on engine (4600€ auto / 4300€ manual)
 */

interface CalcInput {
    pvpTotal: number;
    discountPercent: number;
    discountFixed: number;
    ivaRate: number;
    location: 'peninsula' | 'canarias' | 'internacional';
    engineName?: string;
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
    const { pvpTotal, discountPercent, discountFixed, ivaRate, location, engineName = '' } = input;

    const discountPercentAmount = pvpTotal * (discountPercent / 100);
    const totalAfterDiscounts = Math.max(0, pvpTotal - discountPercentAmount - discountFixed);

    // Prices are NET — add tax on top
    const precioBase = totalAfterDiscounts;
    const ivaAmount = totalAfterDiscounts * (ivaRate / 100);
    const total = totalAfterDiscounts + ivaAmount;

    // IEDMT: fixed amount based on engine, applies to peninsula + canarias
    const iedmtApplies = location !== 'internacional';
    let iedmt = 0;
    if (iedmtApplies) {
        iedmt = engineName.toLowerCase().includes('automático') ? 4600 : 4300;
    }
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
                engineName: 'Cambio automático 180CV - Gris Lanzarote',
            });

            expect(result.discountPercentAmount).toBe(5000);
            expect(result.totalAfterDiscounts).toBe(45000);
            // precioBase = net = 45000
            expect(result.precioBase).toBe(45000);
            // IVA added on top: 45000 * 0.21 = 9450
            expect(result.ivaAmount).toBe(9450);
            expect(result.total).toBe(54450);
            // IEDMT: automatic = 4600€
            expect(result.iedmt).toBe(4600);
        });

        it('should apply 5.5% discount on Canarias with IVA 0%', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 60000,
                discountPercent: 5.5,
                discountFixed: 0,
                ivaRate: 0,
                location: 'canarias',
                engineName: 'Cambio manual 140CV',
            });

            expect(result.discountPercentAmount).toBe(3300); // 60000 * 0.055
            expect(result.totalAfterDiscounts).toBe(56700);
            // IVA 0% for Canarias
            expect(result.ivaAmount).toBe(0);
            expect(result.total).toBe(56700);
            // IEDMT: manual = 4300€ (applies in Canarias)
            expect(result.iedmt).toBe(4300);
            expect(result.totalWithIedmt).toBe(61000);
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
            // IVA added on top: 45000 * 0.21 = 9450
            expect(result.total).toBe(54450);
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
            expect(result.total).toBe(0); // 0 + 0% = 0
            // IEDMT still applies (fixed amount) but total is 0 + iedmt
            expect(result.iedmt).toBe(4300);
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
            // IVA on top: 48000 * 0.21 = 10080
            expect(result.total).toBe(58080);
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
            // IVA on top: 44500 * 0.21 = 9345
            expect(result.total).toBe(53845);
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
            // precioBase = net = 53000
            expect(result.precioBase).toBe(53000);
            // IVA on top: 53000 * 0.21 = 11130
            expect(result.ivaAmount).toBe(11130);
            expect(result.total).toBe(64130);
            // IEDMT: fixed amount for manual (no engineName specified)
            expect(result.iedmt).toBe(4300);
        });
    });

    // ── Location-specific ────────────────────────────────
    describe('Location-specific behavior', () => {
        it('should have IEDMT for Canarias too', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 5,
                discountFixed: 0,
                ivaRate: 0,
                location: 'canarias',
                engineName: 'Cambio automático 180CV - Gris Lanzarote',
            });

            // IEDMT applies in Canarias too (automatic = 4600€)
            expect(result.iedmt).toBe(4600);
            expect(result.totalWithIedmt).toBe(result.total + 4600);
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
            // Internacional: ivaRate=0, so total = net
            expect(result.total).toBe(49000);
            expect(result.totalWithIedmt).toBe(49000);
        });

        it('should have IEDMT for Península (automatic engine)', () => {
            const result = calculateWithDiscounts({
                pvpTotal: 50000,
                discountPercent: 0,
                discountFixed: 0,
                ivaRate: 21,
                location: 'peninsula',
                engineName: 'Cambio automático 180CV - Gris Lanzarote',
            });

            // IVA on top: 50000 * 0.21 = 10500
            expect(result.total).toBe(60500);
            expect(result.iedmt).toBe(4600);
            expect(result.totalWithIedmt).toBe(60500 + 4600);
        });
    });
});
