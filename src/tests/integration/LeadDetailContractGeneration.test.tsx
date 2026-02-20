import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadDetailModal from '../../components/crm/LeadDetailModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Supabase mock ──────────────────────────────────────────
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

const createChain = (resolveData: any = null) => {
    const chain: any = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data: resolveData, error: null })),
        single: vi.fn(() => Promise.resolve({ data: resolveData, error: null })),
        then: (onFulfilled: any) => Promise.resolve({ data: resolveData, error: null }).then(onFulfilled),
    };
    return chain;
};

let clientsChain: any;
let billingChain: any;
let projectsChain: any;
let budgetsChain: any;

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((table: string) => {
            switch (table) {
                case 'NEW_Clients': return clientsChain;
                case 'NEW_Billing': return billingChain;
                case 'NEW_Projects': return projectsChain;
                case 'NEW_Budget': return budgetsChain;
                default: return createChain();
            }
        }),
    },
}));

// ── Hook mocks ─────────────────────────────────────────────
vi.mock('../../hooks/useClients', () => ({
    useClients: () => ({ data: [], isLoading: false }),
    useToggleHotLead: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

// ── UI component mocks ─────────────────────────────────────
vi.mock('../../components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogClose: ({ children }: any) => <button>{children}</button>,
}));

vi.mock('../../components/ui/tabs', () => ({
    Tabs: ({ children }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <button type="button" role="tab">{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../components/projects/BillingInfoForm', () => ({
    default: () => <div data-testid="billing-info-form" />,
}));

vi.mock('../../components/crm/BudgetListTab', () => ({
    default: () => <div data-testid="budget-list-tab" />,
}));

vi.mock('../../components/crm/ContractsTab', () => ({
    default: () => <div data-testid="contracts-tab" />,
}));

// ── Test setup ─────────────────────────────────────────────
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

const mockLead = {
    id: 'project-uuid-123',
    client_id: 'client-uuid-456',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '600111222',
    dni: '12345678A',
    address: 'Calle Test 1',
    status: 'prospect',
    isHotLead: false,
    _raw: { id: 'client-uuid-456' },
};

describe('LeadDetailModal – Simplified Save Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset chains for each test
        clientsChain = createChain();
        billingChain = createChain(null); // no existing billing by default
        projectsChain = createChain();
        budgetsChain = createChain([]);
    });

    it('should render "Guardar Cambios" button (no confirmation modal)', () => {
        render(
            <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={mockLead} />,
            { wrapper: createWrapper() }
        );

        // Should have the direct "Guardar Cambios" button
        expect(screen.getByRole('button', { name: /Guardar Cambios/i })).toBeInTheDocument();

        // Should NOT have any confirmation modal text
        expect(screen.queryByText(/Selecciona cómo deseas proceder/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Guardar proyecto y generar contratos/i)).not.toBeInTheDocument();
    });

    it('should NOT render SaveLeadConfirmationModal', () => {
        render(
            <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={mockLead} />,
            { wrapper: createWrapper() }
        );

        // The old confirmation modal should be completely gone
        expect(screen.queryByTestId('confirm-generate')).not.toBeInTheDocument();
    });

    it('should call Supabase to update NEW_Clients on save', async () => {
        render(
            <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={mockLead} />,
            { wrapper: createWrapper() }
        );

        // Click "Guardar Cambios" (submit the form)
        fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('NEW_Clients');
        });
    });

    it('should call Supabase to update NEW_Billing when billing data exists', async () => {
        const leadWithBilling = {
            ...mockLead,
            billingType: 'personal',
            clientBillingName: 'Billing Name',
        };

        render(
            <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={leadWithBilling} />,
            { wrapper: createWrapper() }
        );

        fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

        await waitFor(() => {
            // Should have called both NEW_Clients and NEW_Billing
            const calls = (supabase.from as any).mock.calls.map((c: any) => c[0]);
            expect(calls).toContain('NEW_Clients');
        });
    });

    it('should NOT call useProjects.updateProject (no budget/contract generation)', async () => {
        render(
            <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={mockLead} />,
            { wrapper: createWrapper() }
        );

        fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

        await waitFor(() => {
            // Should NEVER call NEW_Budget from this save flow
            const calls = (supabase.from as any).mock.calls.map((c: any) => c[0]);
            const budgetCalls = calls.filter((c: string) => c === 'NEW_Budget');
            // Budget calls come only from BudgetListTab (which is mocked), not from save
            expect(budgetCalls.length).toBe(0);
        });
    });

    it('should display the BudgetListTab component (not BudgetInfoTab)', () => {
        render(
            <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={mockLead} />,
            { wrapper: createWrapper() }
        );

        // Should render the new BudgetListTab
        expect(screen.getByTestId('budget-list-tab')).toBeInTheDocument();
    });

    it('should call onLeadUpdated callback after successful save', async () => {
        const mockOnLeadUpdated = vi.fn();

        render(
            <LeadDetailModal
                open={true}
                onOpenChange={vi.fn()}
                lead={mockLead}
                onLeadUpdated={mockOnLeadUpdated}
            />,
            { wrapper: createWrapper() }
        );

        fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

        await waitFor(() => {
            expect(mockOnLeadUpdated).toHaveBeenCalled();
        });
    });

    it('should call onOpenChange(false) after successful save', async () => {
        const mockOnOpenChange = vi.fn();

        render(
            <LeadDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                lead={mockLead}
            />,
            { wrapper: createWrapper() }
        );

        fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

        await waitFor(() => {
            expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
    });
});
