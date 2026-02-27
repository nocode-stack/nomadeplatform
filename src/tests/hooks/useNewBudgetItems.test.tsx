import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBudgetItems, useCreateBudgetItem, useDeleteBudgetItem, useAddCatalogItemToBudget, calculateBudgetTotals } from '../../hooks/useNewBudgetItems';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => {
            const chain: any = {
                select: vi.fn(() => chain),
                insert: (...args: any[]) => {
                    mockInsert(...args);
                    return {
                        select: vi.fn(() => ({
                            single: vi.fn(() => Promise.resolve({
                                data: { id: 'item-new', budget_id: 'bud-1', name: 'Test', price: 100, quantity: 1 },
                                error: null
                            }))
                        }))
                    };
                },
                update: (...args: any[]) => ({
                    eq: vi.fn(() => ({
                        select: vi.fn(() => ({
                            single: vi.fn(() => Promise.resolve({
                                data: { id: 'item-1', price: 600 },
                                error: null
                            }))
                        }))
                    }))
                }),
                delete: (...args: any[]) => {
                    mockDelete(...args);
                    return {
                        eq: vi.fn(() => Promise.resolve({ error: null }))
                    };
                },
                eq: vi.fn(() => chain),
                order: vi.fn(() => chain),
                then: (cb: any) => Promise.resolve({
                    data: [
                        { id: 'item-1', budget_id: 'bud-1', name: 'Extra A', price: 500, quantity: 1, discount_percentage: 0, line_total: 500 },
                        { id: 'item-2', budget_id: 'bud-1', name: 'Extra B', price: 300, quantity: 2, discount_percentage: 10, line_total: 540 },
                    ],
                    error: null
                }).then(cb),
            };
            return chain;
        }),
    }
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useNewBudgetItems hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useBudgetItems', () => {
        it('should fetch budget items for a given budget ID', async () => {
            const { result } = renderHook(() => useBudgetItems('bud-1'), {
                wrapper: createWrapper()
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toHaveLength(2);
            expect(result.current.data?.[0].name).toBe('Extra A');
        });
    });

    describe('useCreateBudgetItem', () => {
        it('should insert a new budget item', async () => {
            const { result } = renderHook(() => useCreateBudgetItem(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                budget_id: 'bud-1',
                name: 'New Item',
                price: 150,
                quantity: 1,
                discount_percentage: 0,
                line_total: 150,
            } as any);

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    budget_id: 'bud-1',
                    name: 'New Item',
                    price: 150,
                })
            );
        });
    });

    describe('useDeleteBudgetItem', () => {
        it('should delete a budget item', async () => {
            const { result } = renderHook(() => useDeleteBudgetItem(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync('item-1');

            expect(mockDelete).toHaveBeenCalled();
        });
    });

    describe('useAddCatalogItemToBudget', () => {
        it('should add a catalog item to a budget with correct data', async () => {
            const { result } = renderHook(() => useAddCatalogItemToBudget(), {
                wrapper: createWrapper()
            });

            const catalogItem = {
                id: 'cat-1',
                name: 'Catalog Item X',
                price: 250,
                category: 'extras',
                line_total: 250,
            } as any;

            await result.current.mutateAsync({
                catalogItem,
                budgetId: 'bud-1',
                quantity: 2,
                discount_percentage: 5,
            });

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    budget_id: 'bud-1',
                    name: 'Catalog Item X',
                    price: 250,
                    quantity: 2,
                    discount_percentage: 5,
                })
            );
        });
    });
});

describe('calculateBudgetTotals utility', () => {
    const emptyItems: any[] = [];

    it('should calculate totals correctly with base prices only', () => {
        const result = calculateBudgetTotals(45000, 5000, 3000, 0, emptyItems, 0, 21);

        expect(result.subtotal).toBe(53000); // 45000 + 5000 + 3000
        expect(result.ivaAmount).toBe(53000 * 0.21);
        expect(result.total).toBe(53000 * 1.21);
    });

    it('should apply discount percentage correctly', () => {
        const noDiscount = calculateBudgetTotals(10000, 0, 0, 0, emptyItems, 0, 21);
        const withDiscount = calculateBudgetTotals(10000, 0, 0, 0, emptyItems, 10, 21);

        expect(noDiscount.total).toBe(12100); // 10000 * 1.21
        expect(withDiscount.total).toBe(10890); // (10000 - 1000) * 1.21
        expect(withDiscount.total).toBeLessThan(noDiscount.total);
    });

    it('should include items with line_total in totals', () => {
        const items = [
            { id: '1', budget_id: 'b1', name: 'Extra', price: 1000, quantity: 2, discount_percentage: 0, line_total: 2000 },
        ] as any;

        const result = calculateBudgetTotals(10000, 0, 0, 0, items, 0, 21);

        expect(result.itemsTotal).toBe(2000);
        expect(result.subtotal).toBe(12000); // 10000 + 2000
    });

    it('should calculate IVA at specified rate', () => {
        const result21 = calculateBudgetTotals(10000, 0, 0, 0, emptyItems, 0, 21);
        const result0 = calculateBudgetTotals(10000, 0, 0, 0, emptyItems, 0, 0);

        expect(result21.ivaAmount).toBe(2100);
        expect(result0.ivaAmount).toBe(0);
    });

    it('should use electric system pricing override when provided', () => {
        const customPricing = {
            finalPrice: 0,
            originalPrice: 3000,
            discountAmount: 3000,
            isFree: true,
            discountReason: 'Incluido en pack',
        };

        // With override: electric system = 0 (free)
        const resultOverride = calculateBudgetTotals(45000, 5000, 3000, 0, emptyItems, 0, 21, customPricing);
        // Without override: electric system = 3000
        const resultNoOverride = calculateBudgetTotals(45000, 5000, 3000, 0, emptyItems, 0, 21);

        expect(resultOverride.electricSystemPrice).toBe(0); // Free via override
        expect(resultNoOverride.electricSystemPrice).toBe(3000);
        expect(resultOverride.total).toBeLessThan(resultNoOverride.total);
        expect(resultOverride.electricSystemDetails?.isFree).toBe(true);
    });

    it('should include color modifier in subtotal', () => {
        const result = calculateBudgetTotals(10000, 0, 0, 500, emptyItems, 0, 21);
        expect(result.colorModifier).toBe(500);
        expect(result.subtotal).toBe(10500);
    });
});
