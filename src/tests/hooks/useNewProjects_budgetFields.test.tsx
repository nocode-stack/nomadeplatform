import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjects } from '../../hooks/useNewProjects';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock query builder
const mockQueryBuilder: any = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'test-project-id', client_id: 'client-id', status: 'prospect' }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'budget-id', is_primary: true }, error: null }),
};

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => mockQueryBuilder),
        rpc: vi.fn().mockResolvedValue({ data: 'PRO-2026-001', error: null })
    }
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id' }
    })
}));

vi.mock('../../hooks/useUserProfile', () => ({
    useUserProfile: () => ({
        data: { id: 'test-profile-id' },
        isLoading: false
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

describe('useProjects budget fields persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockQueryBuilder.maybeSingle.mockResolvedValue({ data: { id: 'budget-id', is_primary: true }, error: null });
        mockQueryBuilder.single.mockResolvedValue({ data: { id: 'test-project-id', client_id: 'client-id' }, error: null });
    });

    it('should trigger budget update when only discount changes', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            discount: '10'
        };

        await result.current.updateProject('test-project-id', updateData);

        // Should call NEW_Budget update
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
        expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
            discount_percentage: 0.10
        }));
    });

    it('should trigger budget update when only reservationAmount changes', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            reservationAmount: '2000'
        };

        await result.current.updateProject('test-project-id', updateData);

        // Should call NEW_Budget update
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
        expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
            reservation_amount: 2000
        }));
    });

    it('should trigger budget update when only items change', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            items: [{ name: 'Test Item', price: 100, quantity: 1 }]
        };

        await result.current.updateProject('test-project-id', updateData);

        // Should call NEW_Budget update
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
        // It also deletes and re-inserts items
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget_Items');
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(mockQueryBuilder.insert).toHaveBeenCalled();
    });

    it('should NOT delete reservation_amount and discount_percentage even if schema cache error occurs (simulated legacy fallback check)', async () => {
        // Since I removed the fallback block, it should NO LONGER attempt a retry without those fields.
        // If it fails, it should just throw the error.

        mockQueryBuilder.update.mockResolvedValueOnce({
            data: null,
            error: { message: 'Some other error', code: '123' }
        });

        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            discount: '15'
        };

        await expect(result.current.updateProject('test-project-id', updateData)).rejects.toThrow();

        // Ensure it only tried once with the fields
        expect(mockQueryBuilder.update).toHaveBeenCalledTimes(1);
        expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
            discount_percentage: 0.15
        }));
    });
});
