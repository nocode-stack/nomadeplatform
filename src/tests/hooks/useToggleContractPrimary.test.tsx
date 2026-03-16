import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToggleContractPrimary } from '../../hooks/useToggleContractPrimary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockUpdate = vi.fn();
const mockEqCalls: any[] = [];

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => {
            const chain: any = {
                update: (...args: any[]) => {
                    mockUpdate(...args);
                    return chain;
                },
                eq: (...args: any[]) => {
                    mockEqCalls.push(args);
                    return {
                        ...chain,
                        then: (cb: any) => Promise.resolve({ error: null }).then(cb),
                    };
                },
                then: (cb: any) => Promise.resolve({ error: null }).then(cb),
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

describe('useToggleContractPrimary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEqCalls.length = 0;
    });

    it('should call supabase from contracts table', async () => {
        const { supabase } = await import('@/integrations/supabase/client');

        const { result } = renderHook(() => useToggleContractPrimary(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            contractId: 'contract-1',
            projectId: 'proj-1',
            contractType: 'reserva',
            isPrimary: true,
        });

        expect(supabase.from).toHaveBeenCalledWith('contracts');
    });

    it('should call update with is_primary: false when setting primary (to reset others)', async () => {
        const { result } = renderHook(() => useToggleContractPrimary(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            contractId: 'contract-1',
            projectId: 'proj-1',
            contractType: 'reserva',
            isPrimary: true,
        });

        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: true });
    });

    it('should only call update with is_primary: false when unsetting', async () => {
        const { result } = renderHook(() => useToggleContractPrimary(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            contractId: 'contract-1',
            projectId: 'proj-1',
            contractType: 'reserva',
            isPrimary: false,
        });

        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });
    });
});
