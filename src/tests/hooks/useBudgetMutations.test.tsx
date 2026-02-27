import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBudgetMutations } from '../../hooks/useBudgetMutations';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockUpdate = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => ({
            update: (...args: any[]) => {
                mockUpdate(...args);
                return {
                    eq: vi.fn((...eqArgs: any[]) => {
                        return Promise.resolve({ error: null });
                    })
                };
            },
        })),
    }
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

vi.mock('../../hooks/useUnifiedProjects', () => ({
    PROJECT_QUERY_KEYS: {
        all: ['unified-projects'],
        lists: () => ['unified-projects', 'list'],
        detail: (id: string) => ['unified-project', id],
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

describe('useBudgetMutations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should unmark other budgets then mark target as primary', async () => {
        const { result } = renderHook(() => useBudgetMutations(), {
            wrapper: createWrapper()
        });

        // Use mutateAsync via the raw mutation
        // We access markAsPrimary but need mutateAsync for testing
        const promise = new Promise<void>((resolve) => {
            result.current.markAsPrimary(
                { budgetId: 'bud-123', projectId: 'proj-456' },
                { onSettled: () => resolve() }
            );
        });

        await promise;

        expect(supabase.from).toHaveBeenCalledWith('budget');

        // First call: unmark all as not primary
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });

        // Second call: mark target as primary
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: true });
    });

    it('should provide isMarkingAsPrimary state', () => {
        const { result } = renderHook(() => useBudgetMutations(), {
            wrapper: createWrapper()
        });

        expect(result.current.isMarkingAsPrimary).toBe(false);
    });
});
