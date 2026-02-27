import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUpdateBilling } from '../../hooks/useBilling';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Track calls for assertions
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockUpdateFn = vi.fn();
const mockSingleResult = { data: null as any, error: null };

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => {
            const chain: any = {
                select: vi.fn(() => chain),
                insert: mockInsert,
                update: (...args: any[]) => {
                    mockUpdateFn(...args);
                    return {
                        eq: vi.fn(() => Promise.resolve({ error: null }))
                    };
                },
                eq: vi.fn(() => chain),
                single: vi.fn(() => Promise.resolve(mockSingleResult)),
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

vi.mock('@/utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
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

describe('useUpdateBilling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update existing billing record for persona física', async () => {
        // Simulate existing billing found
        mockSingleResult.data = { id: 'billing-1' };
        mockSingleResult.error = null;

        const { result } = renderHook(() => useUpdateBilling(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: {
                name: 'Juan Pérez',
                nif: '12345678Z',
                billing_address: 'Calle Test 1',
                type: 'persona_fisica'
            }
        });

        expect(supabase.from).toHaveBeenCalledWith('billing');
        expect(mockUpdateFn).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Juan Pérez',
                nif: '12345678Z',
                billing_address: 'Calle Test 1',
                type: 'persona_fisica',
            })
        );
    });

    it('should create new billing record when none exists', async () => {
        // Simulate NO existing billing
        mockSingleResult.data = null;
        mockSingleResult.error = null;

        const { result } = renderHook(() => useUpdateBilling(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-new',
            data: {
                name: 'Nuevo Cliente',
                nif: '87654321A',
                type: 'persona_fisica'
            }
        });

        expect(supabase.from).toHaveBeenCalledWith('billing');
        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                client_id: 'client-new',
                name: 'Nuevo Cliente',
                nif: '87654321A',
                type: 'persona_fisica',
            })
        );
    });

    it('should update billing for empresa (company)', async () => {
        mockSingleResult.data = { id: 'billing-2' };
        mockSingleResult.error = null;

        const { result } = renderHook(() => useUpdateBilling(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-456',
            data: {
                name: 'Nomade Vans SL',
                nif: 'B12345678',
                billing_address: 'Polígono Industrial 3',
                type: 'empresa'
            }
        });

        expect(mockUpdateFn).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Nomade Vans SL',
                nif: 'B12345678',
                billing_address: 'Polígono Industrial 3',
                type: 'empresa',
            })
        );
    });

    it('should update billing for otra persona', async () => {
        mockSingleResult.data = { id: 'billing-3' };
        mockSingleResult.error = null;

        const { result } = renderHook(() => useUpdateBilling(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-789',
            data: {
                name: 'María García',
                nif: '98765432B',
                billing_address: 'Av. Otra Persona 5',
                type: 'otra_persona'
            }
        });

        expect(mockUpdateFn).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'María García',
                nif: '98765432B',
                type: 'otra_persona',
            })
        );
    });

    it('should include updated_at in update payload', async () => {
        mockSingleResult.data = { id: 'billing-1' };
        mockSingleResult.error = null;

        const { result } = renderHook(() => useUpdateBilling(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { name: 'Test' }
        });

        expect(mockUpdateFn).toHaveBeenCalledWith(
            expect.objectContaining({ updated_at: expect.any(String) })
        );
    });
});
