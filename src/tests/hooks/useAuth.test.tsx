import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

// Mock Supabase
const mockUpdateUser = vi.fn().mockResolvedValue({ data: {}, error: null });
const mockOnAuthStateChange = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
const mockSignIn = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null });
const mockSignUp = vi.fn().mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });
const mockResetPassword = vi.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockRpc = vi.fn().mockResolvedValue({ data: false, error: null });
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });
const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            updateUser: (data: any) => mockUpdateUser(data),
            onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
            getSession: () => mockGetSession(),
            signInWithPassword: (credentials: any) => mockSignIn(credentials),
            signUp: (options: any) => mockSignUp(options),
            resetPasswordForEmail: (email: string, options: any) => mockResetPassword(email, options),
            signOut: vi.fn().mockResolvedValue({ error: null })
        },
        from: vi.fn((table: string) => ({
            select: vi.fn((query: string) => ({
                eq: vi.fn((column: string, value: any) => ({
                    maybeSingle: () => mockMaybeSingle(),
                    single: () => mockMaybeSingle(), // Reusing mockMaybeSingle for simplicity
                }))
            })),
            update: (data: any) => ({
                eq: (col: string, val: any) => mockUpdate(data)
            }),
            insert: (data: any) => mockInsert(data),
            upsert: (data: any) => mockUpsert(data)
        })),
        rpc: (fn: string, params: any) => mockRpc(fn, params)
    }
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: mockToast
    })
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('hook useAuth - changePassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debería actualizar la contraseña correctamente si el usuario está autenticado', async () => {
        // Mock getSession to return a valid session (initial + inside changePassword)
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'user-123', email: 'test@nomade-nation.com', created_at: '2024-01-01', user_metadata: { name: 'Test user' } }
                }
            },
            error: null
        } as any);

        // Mock onAuthStateChange to fire callback with a session
        mockOnAuthStateChange.mockImplementation((cb: any) => {
            setTimeout(() => cb('SIGNED_IN', {
                user: { id: 'user-123', email: 'test@nomade-nation.com', created_at: '2024-01-01', user_metadata: { name: 'Test user' } }
            }), 0);
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });

        // Mock refreshSession
        (supabase.auth as any).refreshSession = vi.fn().mockResolvedValue({ data: {}, error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await vi.waitFor(() => expect(result.current.isLoading).toBe(false));
        await vi.waitFor(() => expect(result.current.isAuthenticated).toBe(true));

        let success: boolean = false;
        await act(async () => {
            success = await result.current.changePassword('NuevaPassword1');
        });

        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NuevaPassword1' });
        expect(success).toBe(true);
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "Contraseña actualizada"
        }));
    });

    it('no debería permitir contraseñas demasiado cortas', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'user-123', email: 'test@nomade-nation.com' } } },
            error: null
        } as any);

        const { result } = renderHook(() => useAuth(), { wrapper });
        await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

        let success: boolean = true;
        await act(async () => {
            success = await result.current.changePassword('123');
        });

        expect(success).toBe(false);
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            variant: "destructive",
            description: expect.stringContaining("8 caracteres")
        }));
    });
});

describe('hook useAuth - login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debería aceptar emails de cualquier dominio', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

        mockSignIn.mockResolvedValueOnce({ data: { user: { id: 'test' } }, error: null });

        const response = await result.current.login('usuario@gmail.com', '123456');

        expect(response.success).toBe(true);
    });

    it('debería iniciar sesión correctamente con credenciales válidas (cualquier dominio)', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

        mockSignIn.mockResolvedValueOnce({ data: { user: { id: 'test' } }, error: null });

        const response = await result.current.login('test@example.com', 'password-valida');

        expect(response.success).toBe(true);
        expect(mockSignIn).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password-valida'
        });
    });

    it('debería devolver error genérico cuando las credenciales son inválidas (sin revelar si el email existe)', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

        // Mock: signInWithPassword fails with invalid credentials
        mockSignIn.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Invalid login credentials' }
        });
        // Mock: profile exists but login still fails (prevents enumeration)
        mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'profile-1' }, error: null });

        const response = await result.current.login('nuevo@example.com', 'Password1');

        expect(response.success).toBe(false);
        expect(response.error).toBe('Email o contraseña incorrectos.');
    });
});
