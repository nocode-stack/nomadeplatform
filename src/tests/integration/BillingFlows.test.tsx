import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjects } from '../../hooks/useProjectMutations';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({ user: { id: 'user-1' } })
}));

// Mock useUserProfile
vi.mock('../../hooks/useUserProfile', () => ({
    useUserProfile: () => ({ data: { id: 'profile-1' } })
}));

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
        then: (onFulfilled: any) => Promise.resolve(result).then(onFulfilled),
    };
    return builder;
};

vi.mock('@/integrations/supabase/client', () => {
    const mockFrom = vi.fn((table: string) => {
        if (table === 'clients') {
            return createMockQueryBuilder({ data: { id: 'cli-1' }, error: null });
        }
        if (table === 'projects') {
            return createMockQueryBuilder({ data: { id: 'proj-1', client_id: 'cli-1' }, error: null });
        }
        if (table === 'billing') {
            return createMockQueryBuilder({ data: { id: 'bil-1' }, error: null });
        }
        if (table === 'budget') {
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
            auth: { updateUser: vi.fn(() => Promise.resolve({ error: null })) }
        }
    };
});

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('Billing - Otra Persona Física Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create project with other person billing data', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Juan Pérez',
            clientEmail: 'juan@test.com',
            clientPhone: '611222333',
            billingType: 'other_person',
            otherPersonName: 'María García',
            otherPersonDni: '98765432Z',
            otherPersonAddress: 'Calle Otra Persona 5',
            items: []
        };

        await result.current.createProject(leadData);

        expect(supabase.from).toHaveBeenCalledWith('clients');
        expect(supabase.from).toHaveBeenCalledWith('billing');
        expect(supabase.from).toHaveBeenCalledWith('projects');
    });

    it('should update project with other person billing data', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            billingType: 'other_person',
            otherPersonName: 'Pedro López',
            otherPersonDni: '11223344X',
            otherPersonAddress: 'Av. Update 10',
        };

        await result.current.updateProject('proj-1', updateData);

        expect(supabase.from).toHaveBeenCalledWith('billing');
    });
});

describe('Billing - Empresa (Company) Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create project with company billing data', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Carlos Martínez',
            clientEmail: 'carlos@company.com',
            clientPhone: '699888777',
            billingType: 'company',
            clientBillingCompanyName: 'Nomade Vans SL',
            clientBillingCompanyCif: 'B12345678',
            clientBillingCompanyAddress: 'Polígono Industrial 3',
            items: []
        };

        await result.current.createProject(leadData);

        expect(supabase.from).toHaveBeenCalledWith('clients');
        expect(supabase.from).toHaveBeenCalledWith('billing');
        expect(supabase.from).toHaveBeenCalledWith('projects');
    });

    it('should update project with company billing preserving company data', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            billingType: 'company',
            clientBillingCompanyName: 'Updated Vans SL',
            clientBillingCompanyCif: 'B99999999',
            clientBillingCompanyAddress: 'New Address 42',
        };

        await result.current.updateProject('proj-1', updateData);

        expect(supabase.from).toHaveBeenCalledWith('billing');
    });
});
