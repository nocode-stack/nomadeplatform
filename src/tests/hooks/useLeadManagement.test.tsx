import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '../../hooks/useNewProjects';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'user-1' }
    })
}));

// Mock useUserProfile
vi.mock('../../hooks/useUserProfile', () => ({
    useUserProfile: () => ({
        data: { id: 'profile-1' }
    })
}));

// Helper to create a chained mock
const createMockQueryBuilder = (result: any) => {
    const builder: any = {
        select: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        update: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        or: vi.fn(() => builder),
        order: vi.fn(() => builder),
        single: vi.fn(() => Promise.resolve(result)),
        maybeSingle: vi.fn(() => Promise.resolve(result)),
        // Handle the case where the builder itself is awaited
        then: (onFullfilled: any) => Promise.resolve(result).then(onFullfilled),
    };
    return builder;
};

vi.mock('@/integrations/supabase/client', () => {
    const mockFrom = vi.fn((table: string) => {
        console.log(`Mock calling from: ${table}`);
        if (table === 'NEW_Clients') {
            return createMockQueryBuilder({ data: { id: 'cli-1' }, error: null });
        }
        if (table === 'NEW_Projects') {
            return createMockQueryBuilder({ data: { id: 'proj-1', client_id: 'cli-1' }, error: null });
        }
        if (table === 'NEW_Budget') {
            return createMockQueryBuilder({ data: { id: 'bud-1' }, error: null });
        }
        if (table.includes('options') || table.includes('Budget_Packs') || table.includes('Budget_Electric')) {
            return createMockQueryBuilder({ data: [{ id: '1', name: 'Neo', price_modifier: 50000, price: 50000 }], error: null });
        }
        return createMockQueryBuilder({ data: [], error: null });
    });

    return {
        supabase: {
            from: mockFrom,
            rpc: vi.fn(() => Promise.resolve({ data: false, error: null })),
            auth: {
                updateUser: vi.fn(() => Promise.resolve({ error: null })),
            }
        }
    };
});

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useProjects Lead Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a project and persist billing data if provided', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Juan Pérez',
            clientEmail: 'juan@example.com',
            clientPhone: '123456789',
            billingType: 'company',
            clientBillingCompanyName: 'Nomade SL',
            clientBillingCompanyCif: 'B12345678',
            clientBillingCompanyAddress: 'Calle Falsa 123',
            items: []
        };

        await result.current.createProject(leadData);

        // Verify NEW_Clients call
        expect(supabase.from).toHaveBeenCalledWith('NEW_Clients');

        // Verify NEW_Billing call (since billingType is company)
        expect(supabase.from).toHaveBeenCalledWith('NEW_Billing');

        // Verify NEW_Projects call
        expect(supabase.from).toHaveBeenCalledWith('NEW_Projects');

        // Verify initial NEW_Budget call
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
    });

    it('should update project and billing data correctly', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            clientName: 'Juan Pérez Updated',
            billingType: 'other_person',
            otherPersonName: 'Maria Garcia',
            otherPersonDni: '987654321Z',
            discount: '15',
            reservationAmount: '2000'
        };

        await result.current.updateProject('proj-1', updateData);

        // Check client update
        expect(supabase.from).toHaveBeenCalledWith('NEW_Clients');
        // Check billing update/insert
        expect(supabase.from).toHaveBeenCalledWith('NEW_Billing');
        // Check budget update (discount and reservation)
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
    });

    it('should persist budget notes correctly', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            budgetNotes: 'Este presupuesto tiene condiciones especiales de pago.'
        };

        await result.current.updateProject('proj-1', updateData);

        // budgetNotes triggers a project update that includes notes in the budget data
        expect(supabase.from).toHaveBeenCalledWith('NEW_Projects');
    });
});
