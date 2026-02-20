import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeleteLead } from '../../hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
                in: vi.fn(() => Promise.resolve({ error: null }))
            })),
            select: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: [{ id: 'proj-1', NEW_Budget: [{ id: 'bud-1' }] }], error: null }))
            })),
            delete: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ error: null }))
            }))
        }))
    }
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useDeleteLead hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call supabase update and delete in correct sequence', async () => {
        const { result } = renderHook(() => useDeleteLead(), {
            wrapper: createWrapper()
        });

        const clientId = 'test-client-id';

        await result.current.mutateAsync(clientId);

        // Check calls
        expect(supabase.from).toHaveBeenCalledWith('NEW_Contracts');
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
        expect(supabase.from).toHaveBeenCalledWith('NEW_Clients');

        // Verify final call updates the client
        expect(supabase.from).toHaveBeenLastCalledWith('NEW_Clients');
    });

    it('should handle errors correctly', async () => {
        // Mock error response for the first call (contracts)
        (supabase.from as any).mockImplementationOnce(() => ({
            update: () => ({
                eq: () => Promise.resolve({ error: new Error('Contracts deactivation failed') })
            })
        }));

        const { result } = renderHook(() => useDeleteLead(), {
            wrapper: createWrapper()
        });

        await expect(result.current.mutateAsync('id')).rejects.toThrow('Error en contratos: Contracts deactivation failed');
    });
});
