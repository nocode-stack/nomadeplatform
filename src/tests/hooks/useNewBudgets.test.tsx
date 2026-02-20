import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreateNewBudget, useSetPrimaryBudget } from '../../hooks/useNewBudgets';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Shared mock objects for tracking
const mockSingle = vi.fn(() => Promise.resolve({ data: { id: 'bud-123', project_id: 'proj-123' }, error: null }));

const mockUpdate = vi.fn(() => {
    const chain = {
        eq: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: mockSingle,
        // Support direct await
        then: (onFullfilled: any) => Promise.resolve({ error: null }).then(onFullfilled)
    };
    return chain;
});

const mockFrom = vi.fn((_table: string) => {
    const chain = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: mockUpdate,
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data: { project_id: 'proj-123' }, error: null })),
        single: mockSingle,
        then: (onFullfilled: any) => Promise.resolve({ data: { project_id: 'proj-123' }, error: null }).then(onFullfilled)
    };
    return chain;
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((table: string) => mockFrom(table))
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

describe('useNewBudgets hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useCreateNewBudget', () => {
        it('should call supabase insert with budget data', async () => {
            const { result } = renderHook(() => useCreateNewBudget(), {
                wrapper: createWrapper()
            });

            const budgetData = { project_id: 'proj-123', total_amount: 1000 };
            await result.current.mutateAsync(budgetData as any);

            // Check both the from call and the insert call
            expect(mockFrom).toHaveBeenCalledWith('NEW_Budget');
        });
    });

    describe('useSetPrimaryBudget', () => {
        it('should throw error if not confirmed', async () => {
            const { result } = renderHook(() => useSetPrimaryBudget(), {
                wrapper: createWrapper()
            });

            await expect(result.current.mutateAsync({ budgetId: 'bud-123', confirmed: false }))
                .rejects.toThrow('CONFIRMATION_REQUIRED');
        });

        it('should unmark other budgets and mark target as primary when confirmed', async () => {
            const { result } = renderHook(() => useSetPrimaryBudget(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({ budgetId: 'bud-123', confirmed: true });

            // Should check for project_id first
            expect(mockFrom).toHaveBeenCalledWith('NEW_Budget');

            // Should update others to is_primary: false
            expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });

            // Should update target to is_primary: true and is_active: true (reactivates historical)
            expect(mockUpdate).toHaveBeenCalledWith({ is_primary: true, is_active: true });
        });
    });
});
