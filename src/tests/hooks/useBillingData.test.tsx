import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBillingData } from '../../hooks/useBillingData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockBillingData = {
    id: 'billing-1',
    client_id: 'client-123',
    name: 'Juan Pérez',
    nif: '12345678Z',
    billing_address: 'Calle Test 1',
    type: 'persona_fisica',
    created_at: '2024-01-01T00:00:00Z',
};

const mockMaybeSingle = vi.fn(() => Promise.resolve({ data: mockBillingData, error: null }));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => {
            const chain: any = {
                select: vi.fn(() => chain),
                eq: vi.fn(() => chain),
                order: vi.fn(() => chain),
                limit: vi.fn(() => chain),
                maybeSingle: mockMaybeSingle,
            };
            return chain;
        }),
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

describe('useBillingData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch billing data for a valid client ID', async () => {
        const { result } = renderHook(() => useBillingData('client-123'), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockBillingData);
    });

    it('should return null when client ID is undefined', async () => {
        const { result } = renderHook(() => useBillingData(undefined), {
            wrapper: createWrapper()
        });

        // Query should not be enabled
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('should return null when no billing data exists', async () => {
        mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

        const { result } = renderHook(() => useBillingData('client-no-billing'), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBeNull();
    });
});
