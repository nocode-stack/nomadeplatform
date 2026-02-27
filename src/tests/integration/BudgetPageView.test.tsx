import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNewBudgets } from '../../hooks/useNewBudgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * Integration test for viewing budgets from the Presupuestos page perspective.
 * Tests the data layer that powers the page.
 */

const mockBudgets = [
    {
        id: 'bud-1',
        budget_code: 'PRE-001',
        is_primary: true,
        total: 50000,
        created_at: '2024-01-01',
        client_id: 'client-1',
        model_option: { name: 'Neo' },
        engine_option: { name: 'Diesel 150CV' },
    },
    {
        id: 'bud-2',
        budget_code: 'PRE-002',
        is_primary: false,
        total: 60000,
        created_at: '2024-01-02',
        client_id: 'client-2',
        model_option: { name: 'Neo XL' },
        engine_option: { name: 'GLP 150CV' },
    },
    {
        id: 'bud-3',
        budget_code: 'PRE-003',
        is_primary: true,
        total: 75000,
        created_at: '2024-01-03',
        client_id: 'client-3',
        model_option: { name: 'Neo' },
        engine_option: null,
    },
];

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => {
            const chain: any = {
                select: vi.fn(() => chain),
                eq: vi.fn(() => chain),
                or: vi.fn(() => chain),
                order: vi.fn(() => chain),
                then: (cb: any) => Promise.resolve({ data: mockBudgets, error: null }).then(cb),
            };
            return chain;
        }),
    }
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('Budget View from Presupuestos Page - Data Layer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch all budgets', async () => {
        const { result } = renderHook(() => useNewBudgets(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(3);
    });

    it('should return budgets with budget codes', async () => {
        const { result } = renderHook(() => useNewBudgets(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const codes = result.current.data?.map(b => b.budget_code);
        expect(codes).toContain('PRE-001');
        expect(codes).toContain('PRE-002');
        expect(codes).toContain('PRE-003');
    });

    it('should include model option data for display', async () => {
        const { result } = renderHook(() => useNewBudgets(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const models = result.current.data?.map(b => b.model_option?.name);
        expect(models).toContain('Neo');
        expect(models).toContain('Neo XL');
    });

    it('should include primary flag for filtering "Solo Actuales"', async () => {
        const { result } = renderHook(() => useNewBudgets(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const primaryBudgets = result.current.data?.filter(b => b.is_primary);
        expect(primaryBudgets).toHaveLength(2); // bud-1 and bud-3

        const nonPrimary = result.current.data?.filter(b => !b.is_primary);
        expect(nonPrimary).toHaveLength(1); // bud-2
    });
});
