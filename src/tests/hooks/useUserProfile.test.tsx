import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserProfile, useUpdateProfile } from '../../hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Reusable mock objects
const mockMaybeSingle = vi.fn(() => Promise.resolve({ data: { user_id: 'user-123', name: 'Existing User' }, error: null }));
const mockUpsert = vi.fn((_data: any, _options: any): any => ({
    select: vi.fn((): any => ({
        single: vi.fn(() => Promise.resolve({ data: { user_id: 'user-123', name: 'Updated' }, error: null }))
    }))
}));

const mockFrom = vi.fn((_table: string) => {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: mockMaybeSingle,
        upsert: mockUpsert,
        insert: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    };
    return chain;
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((table: string) => mockFrom(table))
    }
}));

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' }
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

describe('hooks useUserProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useUserProfile', () => {
        it('debería devolver el perfil si existe', async () => {
            const { result } = renderHook(() => useUserProfile('user-123'), {
                wrapper: createWrapper()
            });

            await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.name).toBe('Existing User');
            expect(supabase.from).toHaveBeenCalledWith('user_profiles');
        });
    });

    describe('useUpdateProfile', () => {
        it('debería llamar a upsert con los datos correctos del perfil (incluyendo teléfono y departamento)', async () => {
            const { result } = renderHook(() => useUpdateProfile(), {
                wrapper: createWrapper()
            });

            const datosActualizacion = {
                user_id: 'user-123',
                name: 'Nombre Actualizado',
                phone: '600000000',
                department: 'Ventas'
            };

            await result.current.mutateAsync(datosActualizacion);

            expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user-123',
                name: 'Nombre Actualizado',
                phone: '600000000',
                department: 'Ventas'
            }), expect.any(Object));
        });

        it('debería actualizar el avatar_url correctamente', async () => {
            const { result } = renderHook(() => useUpdateProfile(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                user_id: 'user-123',
                avatar_url: 'https://example.com/new-avatar.jpg'
            });

            expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user-123',
                avatar_url: 'https://example.com/new-avatar.jpg'
            }), expect.any(Object));
        });

        it('debería manejar errores de Supabase al actualizar el perfil', async () => {
            mockUpsert.mockImplementationOnce(() => ({
                select: () => ({
                    single: () => Promise.resolve({ data: null, error: { message: 'Error de red' } })
                })
            }));

            const { result } = renderHook(() => useUpdateProfile(), {
                wrapper: createWrapper()
            });

            await expect(result.current.mutateAsync({ user_id: 'user-123', name: 'Error' }))
                .rejects.toThrow('Error de red');
        });
    });
});
