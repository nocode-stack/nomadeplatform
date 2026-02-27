import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUpdateNewBudget, useDeleteNewBudget } from '../../hooks/useNewBudgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockFrom = vi.fn((_table: string) => {
    const chain: any = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: (...args: any[]) => {
            mockUpdate(...args);
            return {
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({
                            data: { id: 'bud-1', model_option_id: 'model-1', total: 50000 },
                            error: null
                        }))
                    })),
                    then: (cb: any) => Promise.resolve({ error: null }).then(cb),
                }))
            };
        },
        delete: (...args: any[]) => {
            mockDelete(...args);
            return {
                eq: vi.fn(() => Promise.resolve({ error: null }))
            };
        },
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data: { id: 'bud-1' }, error: null })),
        then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb),
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

describe('useUpdateNewBudget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update budget fields correctly', async () => {
        const { result } = renderHook(() => useUpdateNewBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            id: 'bud-1',
            model_option_id: 'model-new',
            engine_option_id: 'engine-new',
            total: 55000,
        } as any);

        expect(mockFrom).toHaveBeenCalledWith('budget');
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                model_option_id: 'model-new',
                engine_option_id: 'engine-new',
                total: 55000,
            })
        );
    });

    it('should not include id in the update payload (it goes to .eq)', async () => {
        const { result } = renderHook(() => useUpdateNewBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            id: 'bud-1',
            total: 60000,
        } as any);

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.not.objectContaining({ id: 'bud-1' })
        );
    });
});

describe('useDeleteNewBudget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should delete a budget by ID', async () => {
        const { result } = renderHook(() => useDeleteNewBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync('bud-1');

        expect(mockFrom).toHaveBeenCalledWith('budget');
        expect(mockDelete).toHaveBeenCalled();
    });
});
