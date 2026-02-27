import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectStatusUpdater } from '../../hooks/useProjectStatusUpdater';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockUpdate = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => ({
            update: (...args: any[]) => {
                mockUpdate(...args);
                return {
                    eq: vi.fn(() => Promise.resolve({ error: null }))
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

describe('useProjectStatusUpdater', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update project status via updateProjectStatus', async () => {
        const { result } = renderHook(() => useProjectStatusUpdater('proj-1'), {
            wrapper: createWrapper()
        });

        const promise = new Promise<void>((resolve) => {
            result.current.updateProjectStatus(
                { projectId: 'proj-1', status: 'in_production' },
                { onSettled: () => resolve() }
            );
        });

        await promise;

        expect(supabase.from).toHaveBeenCalledWith('projects');
        expect(mockUpdate).toHaveBeenCalledWith({ status: 'in_production' });
    });

    it('should update project status via updateManualStatus with string', async () => {
        const { result } = renderHook(() => useProjectStatusUpdater('proj-1'), {
            wrapper: createWrapper()
        });

        // updateManualStatus takes either a string or { status: string }
        act(() => {
            result.current.updateManualStatus('delivered');
        });

        // Wait for mutation to complete
        await vi.waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith({ status: 'delivered' });
        });
    });

    it('should update project status via updateManualStatus with object', async () => {
        const { result } = renderHook(() => useProjectStatusUpdater('proj-1'), {
            wrapper: createWrapper()
        });

        act(() => {
            result.current.updateManualStatus({ status: 'cancelled' });
        });

        await vi.waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
        });
    });

    it('should not call mutation if projectId is undefined on updateManualStatus', () => {
        const { result } = renderHook(() => useProjectStatusUpdater(undefined), {
            wrapper: createWrapper()
        });

        result.current.updateManualStatus('in_production');

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should provide isUpdating state', () => {
        const { result } = renderHook(() => useProjectStatusUpdater('proj-1'), {
            wrapper: createWrapper()
        });

        expect(result.current.isUpdating).toBe(false);
        expect(result.current.isUpdatingStatus).toBe(false);
    });
});

// Need to import act for sync mutations
import { act } from '@testing-library/react';
