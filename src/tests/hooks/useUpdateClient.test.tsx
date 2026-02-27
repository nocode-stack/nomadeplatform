import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUpdateClient } from '../../hooks/useClients';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase
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

describe('useUpdateClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update client name correctly', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { name: 'Juan Pérez Actualizado' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Juan Pérez Actualizado' })
        );
        expect(mockEq).toHaveBeenCalledWith('id', 'client-123');
    });

    it('should update client email correctly', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { email: 'nuevo@email.com' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'nuevo@email.com' })
        );
    });

    it('should update client phone correctly', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { phone: '666777888' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ phone: '666777888' })
        );
    });

    it('should update client DNI correctly', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { dni: '12345678Z' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ dni: '12345678Z' })
        );
    });

    it('should update client address correctly', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { address: 'Calle Nueva 42, Madrid' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ address: 'Calle Nueva 42, Madrid' })
        );
    });

    it('should update multiple client fields at once', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: {
                name: 'María García',
                email: 'maria@test.com',
                phone: '611222333',
                dni: '98765432A'
            }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'María García',
                email: 'maria@test.com',
                phone: '611222333',
                dni: '98765432A',
            })
        );
    });

    it('should include updated_at timestamp in update payload', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await result.current.mutateAsync({
            clientId: 'client-123',
            data: { name: 'Test' }
        });

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ updated_at: expect.any(String) })
        );
    });
});
