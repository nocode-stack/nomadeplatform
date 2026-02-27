import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreateNewBudget, useSetPrimaryBudget, useUpdateNewBudget } from '../../hooks/useNewBudgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Shared mock tracking
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockMaybeSingle = vi.fn(() => Promise.resolve({ data: { project_id: 'proj-123' }, error: null }));

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
                                data: { id: 'bud-new', client_id: 'client-1', project_id: 'proj-1' },
                                error: null
                            }))
                        }))
                    };
                },
                update: (...args: any[]) => {
                    mockUpdate(...args);
                    return {
                        eq: vi.fn((...eqArgs: any[]) => ({
                            eq: vi.fn(() => ({
                                then: (cb: any) => Promise.resolve({ error: null }).then(cb),
                            })),
                            select: vi.fn(() => ({
                                single: vi.fn(() => Promise.resolve({
                                    data: { id: 'bud-1', model_option_id: 'model-new' },
                                    error: null
                                }))
                            })),
                            then: (cb: any) => Promise.resolve({ error: null }).then(cb),
                        })),
                    };
                },
                eq: vi.fn(() => chain),
                order: vi.fn(() => chain),
                maybeSingle: mockMaybeSingle,
                single: vi.fn(() => Promise.resolve({
                    data: { id: 'bud-1', client_id: 'client-1' },
                    error: null
                })),
                then: (cb: any) => Promise.resolve({
                    data: { project_id: 'proj-123' },
                    error: null
                }).then(cb),
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

describe('Budget Creation Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new budget with required fields', async () => {
        const { result } = renderHook(() => useCreateNewBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            client_id: 'client-1',
            project_id: 'proj-1',
            model_option_id: 'model-neo',
            engine_option_id: 'engine-1',
            total: 50000,
        } as any);

        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                client_id: 'client-1',
                project_id: 'proj-1',
                model_option_id: 'model-neo',
            })
        );
    });

    it('should create a budget with pack and electric system', async () => {
        const { result } = renderHook(() => useCreateNewBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            client_id: 'client-1',
            project_id: 'proj-1',
            model_option_id: 'model-neo',
            pack_id: 'pack-adventure',
            electric_system_id: 'elec-litio',
            total: 65000,
        } as any);

        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                pack_id: 'pack-adventure',
                electric_system_id: 'elec-litio',
            })
        );
    });
});

describe('Budget Edit Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update budget model and total', async () => {
        const { result } = renderHook(() => useUpdateNewBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            id: 'bud-1',
            model_option_id: 'model-neo-xl',
            total: 65000,
        } as any);

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                model_option_id: 'model-neo-xl',
                total: 65000,
            })
        );
    });

    it('should update budget discount', async () => {
        const { result } = renderHook(() => useUpdateNewBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            id: 'bud-1',
            discount_percentage: 10,
        } as any);

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                discount_percentage: 10,
            })
        );
    });
});

describe('Budget Set as Primary Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should require confirmation before setting primary', async () => {
        const { result } = renderHook(() => useSetPrimaryBudget(), {
            wrapper: createWrapper()
        });

        await expect(
            result.current.mutateAsync({
                budgetId: 'bud-1',
                clientId: 'client-1',
                confirmed: false,
            })
        ).rejects.toThrow('CONFIRMATION_REQUIRED');
    });

    it('should set budget as primary when confirmed', async () => {
        const { result } = renderHook(() => useSetPrimaryBudget(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            budgetId: 'bud-1',
            clientId: 'client-1',
            confirmed: true,
        });

        // Should first unmark all as not primary
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });
        // Should then mark target as primary and active
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: true, is_active: true });
    });
});
