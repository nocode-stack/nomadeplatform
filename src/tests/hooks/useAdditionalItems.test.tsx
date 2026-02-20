import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCatalogItems, useCreateAdditionalItem, useAddCatalogItemToBudget, useDeleteBudgetItem } from '../../hooks/useNewBudgetItems';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Chained mock helper
const createMockQueryBuilder = (result: any) => {
    const builder: any = {
        select: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        update: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        order: vi.fn(() => builder),
        single: vi.fn(() => Promise.resolve(result)),
        maybeSingle: vi.fn(() => Promise.resolve(result)),
        then: (onFullfilled: any) => Promise.resolve(result).then(onFullfilled),
    };
    return builder;
};

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((table: string) => {
            if (table === 'NEW_Budget_Additional_Items') {
                return createMockQueryBuilder({ data: [{ id: '1', name: 'Placa Solar', price: 500 }], error: null });
            }
            if (table === 'NEW_Budget_Items') {
                return createMockQueryBuilder({ data: { id: 'item-101' }, error: null });
            }
            return createMockQueryBuilder({ data: [], error: null });
        })
    }
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('Additional Items Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch catalog items', async () => {
        const { result } = renderHook(() => useCatalogItems(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data![0].name).toBe('Placa Solar');
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget_Additional_Items');
    });

    it('should create a new catalog item (personalized/template)', async () => {
        const { result } = renderHook(() => useCreateAdditionalItem(), {
            wrapper: createWrapper()
        });

        const newItem = {
            name: 'Batería Litio',
            price: 1200,
            is_general: true,
            category: 'Electricidad'
        };

        await result.current.mutateAsync(newItem);

        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget_Additional_Items');
        // Verify it sent correct data
        expect((supabase.from as any).mock.results[0].value.insert).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Batería Litio',
            is_general: true
        }));
    });

    it('should add a catalog item to a budget', async () => {
        const { result } = renderHook(() => useAddCatalogItemToBudget(), {
            wrapper: createWrapper()
        });

        const catalogItem = {
            name: 'Inversor',
            price: 800,
            category: 'Electricidad'
        };

        await result.current.mutateAsync({
            catalogItem: catalogItem as any,
            budgetId: 'bud-123',
            quantity: 2
        });

        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget_Items');
        expect((supabase.from as any).mock.results[0].value.insert).toHaveBeenCalledWith(expect.objectContaining({
            budget_id: 'bud-123',
            name: 'Inversor',
            quantity: 2,
            line_total: 1600
        }));
    });

    it('should delete a budget item', async () => {
        const { result } = renderHook(() => useDeleteBudgetItem(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync('item-to-delete');

        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget_Items');
        expect((supabase.from as any).mock.results[0].value.delete).toHaveBeenCalled();
    });
});
