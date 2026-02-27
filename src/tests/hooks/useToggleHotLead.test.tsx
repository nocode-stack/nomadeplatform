import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToggleHotLead } from '../../hooks/useClients';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => ({
            update: (...args: any[]) => {
                mockUpdate(...args);
                return {
                    eq: (...eqArgs: any[]) => {
                        mockEq(...eqArgs);
                        return Promise.resolve({ error: null });
                    }
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

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useToggleHotLead', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should mark a lead as hot lead', async () => {
        const { result } = renderHook(() => useToggleHotLead(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({ clientId: 'client-123', isHotLead: true });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ is_hot_lead: true })
        );
        expect(mockEq).toHaveBeenCalledWith('id', 'client-123');
    });

    it('should unmark a lead as hot lead', async () => {
        const { result } = renderHook(() => useToggleHotLead(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({ clientId: 'client-456', isHotLead: false });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ is_hot_lead: false })
        );
        expect(mockEq).toHaveBeenCalledWith('id', 'client-456');
    });

    it('should include updated_at timestamp when toggling', async () => {
        const { result } = renderHook(() => useToggleHotLead(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({ clientId: 'client-123', isHotLead: true });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ updated_at: expect.any(String) })
        );
    });

    it('should throw error when supabase returns error', async () => {
        const mockFromWithError = vi.fn((_table: string) => ({
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: new Error('DB error') }))
            })),
        }));

        const { supabase } = await import('@/integrations/supabase/client');
        (supabase.from as any) = mockFromWithError;

        const { result } = renderHook(() => useToggleHotLead(), {
            wrapper: createWrapper()
        });

        await expect(
            result.current.mutateAsync({ clientId: 'client-123', isHotLead: true })
        ).rejects.toThrow();
    });
});
