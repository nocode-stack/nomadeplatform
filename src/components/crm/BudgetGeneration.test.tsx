import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewLeadModal from '../crm/NewLeadModal';
import LeadDetailModal from '../crm/LeadDetailModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Supabase mock ──────────────────────────────────────────
const createChain = (data: any = null) => {
    const chain: any = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
        single: vi.fn(() => Promise.resolve({ data, error: null })),
        then: (onFulfilled: any) => Promise.resolve({ data, error: null }).then(onFulfilled),
    };
    return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => createChain([])),
    },
}));

// ── Hook mocks ─────────────────────────────────────────────
const mockCreateProject = vi.fn();
vi.mock('../../hooks/useNewProjects', () => ({
    useProjects: () => ({
        createProject: mockCreateProject,
        isLoading: false,
    }),
}));

const mockCreateBudget = vi.fn();
const mockGenerateContract = vi.fn();
vi.mock('../../hooks/useContractVersioning', () => ({
    useContractVersioning: () => ({
        generateContract: {
            mutateAsync: mockGenerateContract,
        },
    }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

// ── Budget option mocks ────────────────────────────────────
vi.mock('../../hooks/useNewBudgets', () => ({
    useModelOptions: () => ({
        data: [
            { id: 'm1', name: 'Neo', price: 45000, price_modifier: 45000 },
            { id: 'm2', name: 'Neo S', price: 52000, price_modifier: 52000 },
        ],
        isLoading: false,
    }),
    useEngineOptions: () => ({
        data: [
            { id: 'e1', name: 'Diesel 140cv', price_modifier: 0 },
            { id: 'e2', name: 'Diesel 180cv', price_modifier: 3500 },
        ],
        isLoading: false,
    }),
    useExteriorColorOptions: () => ({
        data: [{ id: 'c1', name: 'Blanco', price: 0 }],
        isLoading: false,
    }),
    useInteriorColorOptions: () => ({
        data: [{ id: 'i1', name: 'Madera', price: 0 }],
        isLoading: false,
    }),
    useNewBudgetPacks: () => ({
        data: [
            { id: 'p1', name: 'Pack Nomade', price: 1500 },
            { id: 'p2', name: 'Pack Esencial', price: 0 },
        ],
        isLoading: false,
    }),
    useElectricSystems: () => ({
        data: [{ id: 'el1', name: 'Sistema Pro', price: 0 }],
        isLoading: false,
    }),
    useCreateNewBudget: () => ({
        mutateAsync: mockCreateBudget,
    }),
    useProjectBudgets: () => ({
        data: [],
        isLoading: false,
    }),
    useSetPrimaryBudget: () => ({
        mutateAsync: vi.fn(),
    }),
    useNewBudgetItems: () => ({
        data: [],
        isLoading: false,
    }),
}));

vi.mock('../../hooks/useClients', () => ({
    useClients: () => ({ data: [], isLoading: false }),
    useToggleHotLead: () => ({ mutateAsync: vi.fn() }),
}));

// ── UI component mocks ─────────────────────────────────────
vi.mock('../ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogClose: ({ children }: any) => <button>{children}</button>,
}));

vi.mock('../ui/select', () => ({
    Select: ({ children, onValueChange, value, disabled }: any) => (
        <select
            data-testid="select"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
        >
            {children}
        </select>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder, value }: any) => <span>{value || placeholder}</span>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

vi.mock('../projects/BillingInfoForm', () => ({
    default: () => <div data-testid="billing-info-form" />,
}));
vi.mock('./BudgetListTab', () => ({
    default: () => <div data-testid="budget-list-tab" />,
}));
vi.mock('./ContractsTab', () => ({
    default: () => <div data-testid="contracts-tab" />,
}));
vi.mock('../ui/tabs', () => ({
    Tabs: ({ children }: any) => <div data-testid="tabs-root">{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <button type="button" role="tab">{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
}));

describe('Budget Generation TDD', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
    });

    const renderNewLeadModal = (props = {}) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <NewLeadModal open={true} onOpenChange={vi.fn()} {...props} />
            </QueryClientProvider>
        );
    };

    it('NewLeadModal: should submit form and call createProject with save_only mode', async () => {
        const mockProject = { id: 'project-123', client_id: 'client-456' };
        mockCreateProject.mockResolvedValueOnce(mockProject);

        renderNewLeadModal();

        // Fill contact details
        fireEvent.change(screen.getByPlaceholderText(/Nombre del cliente/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText(/Teléfono de contacto/i), { target: { value: '123456789' } });
        fireEvent.change(screen.getByPlaceholderText(/Email del cliente/i), { target: { value: 'test@example.com' } });

        // Submit form directly (no confirmation modal in new flow)
        const submitBtn = screen.getByRole('button', { name: /Registrar Lead/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockCreateProject).toHaveBeenCalledWith(expect.objectContaining({
                clientName: 'Test User',
            }), 'save_only');
        });

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "Lead registrado",
        }));
    });

    it('LeadDetailModal: should use BudgetListTab instead of BudgetInfoTab', () => {
        const mockLead = {
            id: 'proj-123',
            client_id: 'client-456',
            name: 'Test',
            email: 'test@test.com',
            phone: '600000000',
            status: 'prospect',
            _raw: { id: 'client-456' },
        };

        render(
            <QueryClientProvider client={queryClient}>
                <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={mockLead} />
            </QueryClientProvider>
        );

        // Should render BudgetListTab (new component)
        expect(screen.getByTestId('budget-list-tab')).toBeInTheDocument();
    });

    it('LeadDetailModal: should NOT have confirmation modal anymore', () => {
        const mockLead = {
            id: 'proj-123',
            client_id: 'client-456',
            name: 'Test',
            email: 'test@test.com',
            phone: '600000000',
            status: 'prospect',
            _raw: { id: 'client-456' },
        };

        render(
            <QueryClientProvider client={queryClient}>
                <LeadDetailModal open={true} onOpenChange={vi.fn()} lead={mockLead} />
            </QueryClientProvider>
        );

        // Confirmation modal should NOT be rendered
        expect(screen.queryByTestId('confirm-generate')).not.toBeInTheDocument();
    });
});
