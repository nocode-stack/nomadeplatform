import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUpdateClient } from '../../hooks/useClients';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * Integration test for Lead Modification — tests that the useUpdateClient hook
 * correctly transmits field changes to Supabase.
 */

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

describe('Lead Modification Flow - useUpdateClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should modify lead name field and save', async () => {
        const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { name: 'Nombre Modificado' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Nombre Modificado' })
        );
        expect(mockEq).toHaveBeenCalledWith('id', 'client-123');
    });

    it('should modify lead email field and save', async () => {
        const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { email: 'nuevo@correo.com' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'nuevo@correo.com' })
        );
    });

    it('should modify lead phone field and save', async () => {
        const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { phone: '699888777' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ phone: '699888777' })
        );
    });

    it('should modify lead DNI field and save', async () => {
        const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { dni: '12345678Z' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ dni: '12345678Z' })
        );
    });

    it('should modify lead address field and save', async () => {
        const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { address: 'Calle Nueva 42, Barcelona' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ address: 'Calle Nueva 42, Barcelona' })
        );
    });

    it('should modify lead birthdate field and save', async () => {
        const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { birthdate: '1990-05-15' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ birthdate: '1990-05-15' })
        );
    });

    it('should modify all lead fields at once and save', async () => {
        const { result } = renderHook(() => useUpdateClient(), { wrapper: createWrapper() });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: {
                name: 'Juan García',
                email: 'juan.garcia@test.com',
                phone: '611222333',
                dni: '98765432A',
                address: 'Av. Modificada 10',
            }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Juan García',
                email: 'juan.garcia@test.com',
                phone: '611222333',
                dni: '98765432A',
                address: 'Av. Modificada 10',
            })
        );
    });
});
