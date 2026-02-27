import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDepartmentPermissions } from '../../hooks/useDepartmentPermissions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'user-1', department: 'Ventas' }
    })
}));

// Mock useUserProfile
vi.mock('../../hooks/useUserProfile', () => ({
    useUserProfile: () => ({
        data: { id: 'profile-1', department: 'Ventas' }
    })
}));

// Mock supabase (not directly used but imported)
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
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

describe('useDepartmentPermissions - Ventas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return Ventas permissions for Ventas department', async () => {
        const { result } = renderHook(() => useDepartmentPermissions(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const perms = result.current.data!;
        expect(perms.canEdit).toBe(true);
        expect(perms.canDelete).toBe(false);
        expect(perms.canValidate).toBe(false);
        expect(perms.canCreateProjects).toBe(true);
        expect(perms.routes).toContain('/crm');
        expect(perms.routes).toContain('/presupuestos');
        expect(perms.routes).toContain('/contratos');
    });

    it('should include department info in result', async () => {
        const { result } = renderHook(() => useDepartmentPermissions(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.department?.name).toBe('Ventas');
        expect(result.current.data?.department?.is_active).toBe(true);
    });

    it('should not include admin route for Ventas', async () => {
        const { result } = renderHook(() => useDepartmentPermissions(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.routes).not.toContain('/admin');
    });
});
