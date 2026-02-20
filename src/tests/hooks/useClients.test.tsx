import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUpdateClient } from '../../hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null }))
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

describe('useUpdateClient hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call supabase update with correct data', async () => {
        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        const clientId = 'test-client-id';
        const updateData = { name: 'Updated Name' };

        await result.current.mutateAsync({ clientId, data: updateData });

        expect(supabase.from).toHaveBeenCalledWith('NEW_Clients');
    });

    it('should handle errors correctly', async () => {
        // Mock error response
        (supabase.from as any).mockImplementationOnce(() => ({
            update: () => ({
                eq: () => Promise.resolve({ error: new Error('Update failed') })
            })
        }));

        const { result } = renderHook(() => useUpdateClient(), {
            wrapper: createWrapper()
        });

        await expect(result.current.mutateAsync({
            clientId: 'id',
            data: { name: 'Test' }
        })).rejects.toThrow('Update failed');
    });
});
