import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBudgetConfigurator } from '../../hooks/useBudgetConfigurator';
import React from 'react';

// Mock the dependent hooks
vi.mock('../../hooks/useNewBudgets', () => ({
    useNewBudgetPacks: () => ({
        data: [
            { id: 'pack-1', name: 'Essentials', price: 5000, is_active: true },
            { id: 'pack-2', name: 'Adventure', price: 8000, is_active: true },
            { id: 'pack-3', name: 'Ultimate', price: 12000, is_active: true },
        ],
        isLoading: false,
    }),
    useElectricSystems: () => ({
        data: [
            { id: 'elec-1', name: 'Litio', price: 3000, is_active: true },
            { id: 'elec-2', name: 'Litio+', price: 5000, is_active: true },
            { id: 'elec-3', name: 'Litio Pro', price: 7000, is_active: true },
        ],
        isLoading: false,
    }),
}));

vi.mock('../../hooks/useElectricSystemPricing', () => ({
    useElectricSystemPricing: () => ({
        data: {
            finalPrice: 0,
            originalPrice: 3000,
            discountAmount: 3000,
            isFree: true,
            discountReason: 'Incluido en pack',
        },
    }),
}));

describe('useBudgetConfigurator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with empty selections', () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        expect(result.current.selectedPack).toBe('');
        expect(result.current.selectedElectricSystem).toBe('');
        expect(result.current.autoSelected).toBe(false);
    });

    it('should initialize with provided initial values', () => {
        const { result } = renderHook(() => useBudgetConfigurator('pack-1', 'elec-1'));

        expect(result.current.selectedPack).toBe('pack-1');
        expect(result.current.selectedElectricSystem).toBe('elec-1');
    });

    it('should handle pack selection', () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        act(() => {
            result.current.handlePackSelect('pack-1');
        });

        expect(result.current.selectedPack).toBe('pack-1');
    });

    it('should handle electric system selection and clear auto flag', () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        act(() => {
            result.current.handleElectricSystemSelect('elec-2');
        });

        expect(result.current.selectedElectricSystem).toBe('elec-2');
        expect(result.current.autoSelected).toBe(false);
    });

    it('should handle electric system deselection', () => {
        const { result } = renderHook(() => useBudgetConfigurator(undefined, 'elec-1'));

        act(() => {
            result.current.handleElectricSystemDeselect();
        });

        expect(result.current.selectedElectricSystem).toBe('');
        expect(result.current.autoSelected).toBe(false);
    });

    it('should auto-select Litio system when Adventure pack is selected', async () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        act(() => {
            result.current.handlePackSelect('pack-2'); // Adventure
        });

        // Wait for useEffect to fire
        await vi.waitFor(() => {
            expect(result.current.selectedElectricSystem).toBe('elec-1'); // Litio básico
            expect(result.current.autoSelected).toBe(true);
        });
    });

    it('should auto-select Litio system when Ultimate pack is selected', async () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        act(() => {
            result.current.handlePackSelect('pack-3'); // Ultimate
        });

        await vi.waitFor(() => {
            expect(result.current.selectedElectricSystem).toBe('elec-1'); // Litio básico
            expect(result.current.autoSelected).toBe(true);
        });
    });

    it('should return packs and electric systems data', () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        expect(result.current.packs).toHaveLength(3);
        expect(result.current.electricSystems).toHaveLength(3);
    });

    it('should return configuration with correct structure', () => {
        const { result } = renderHook(() => useBudgetConfigurator('pack-1', 'elec-1'));

        const config = result.current.configuration;
        expect(config).not.toBeNull();
        expect(config?.pack.id).toBe('pack-1');
        expect(config?.pack.name).toBe('Essentials');
        expect(config?.pack.price).toBe(5000);
        expect(config?.electricSystem.id).toBe('elec-1');
        expect(config?.electricSystem.name).toBe('Litio');
    });

    it('should return null configuration when nothing selected', () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        expect(result.current.configuration).toBeNull();
    });

    it('should report loading state correctly', () => {
        const { result } = renderHook(() => useBudgetConfigurator());

        expect(result.current.isLoading).toBe(false);
    });
});
