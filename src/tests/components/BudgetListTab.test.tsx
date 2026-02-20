import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BudgetListTab from '../../components/crm/BudgetListTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mock data ──────────────────────────────────────────────
const mockBudgets = [
    {
        id: 'budget-1',
        project_id: 'proj-123',
        is_primary: true,
        is_active: true,
        total: 52500,
        created_at: '2026-02-15T10:00:00Z',
        model_option: { name: 'Neo S' },
        engine_option: { name: 'Diesel 180cv' },
    },
    {
        id: 'budget-2',
        project_id: 'proj-123',
        is_primary: false,
        is_active: true,
        total: 45000,
        created_at: '2026-02-10T10:00:00Z',
        model_option: { name: 'Neo' },
        engine_option: { name: 'Diesel 140cv' },
    },
    {
        id: 'budget-3',
        project_id: 'proj-123',
        is_primary: false,
        is_active: true,
        total: 48000,
        created_at: '2026-02-05T10:00:00Z',
        model_option: { name: 'Neo' },
        engine_option: { name: 'Diesel 180cv' },
    },
];

const mockSetPrimaryMutateAsync = vi.fn();

// ── Mock hooks ─────────────────────────────────────────────
vi.mock('../../hooks/useNewBudgets', () => ({
    useProjectBudgets: vi.fn((projectId: string) => ({
        data: projectId ? mockBudgets : [],
        isLoading: false,
    })),
    useSetPrimaryBudget: () => ({
        mutateAsync: mockSetPrimaryMutateAsync,
    }),
    useNewBudgetItems: () => ({
        data: [],
        isLoading: false,
    }),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../components/crm/BudgetEditorModal', () => ({
    default: () => <div data-testid="budget-editor-modal" />,
}));

vi.mock('../../components/crm/BudgetPrintView', () => ({
    default: () => <div data-testid="budget-print-view" />,
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

describe('BudgetListTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render a list of budgets', () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        // Should show count
        expect(screen.getByText(/3 presupuestos/i)).toBeInTheDocument();

        // Should show budget labels (uses budget_code || Presupuesto #N)
        expect(screen.getByText('Presupuesto #3')).toBeInTheDocument();
        expect(screen.getByText('Presupuesto #2')).toBeInTheDocument();
        expect(screen.getByText('Presupuesto #1')).toBeInTheDocument();
    });

    it('should display budget amounts', () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('52.500€')).toBeInTheDocument();
        expect(screen.getByText('45.000€')).toBeInTheDocument();
        expect(screen.getByText('48.000€')).toBeInTheDocument();
    });

    it('should show "Principal" badge for primary budget', () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Principal')).toBeInTheDocument();
    });

    it('should display model and engine info', () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        // First budget: Neo S · Diesel 180cv
        expect(screen.getByText(/Neo S · Diesel 180cv/)).toBeInTheDocument();
    });

    it('should show empty state when no budgets exist', () => {
        render(
            <BudgetListTab projectId="" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText(/Sin presupuestos/i)).toBeInTheDocument();
    });

    it('should have star buttons for toggling primary', () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        const starButtons = screen.getAllByTitle(/Presupuesto preferido|Marcar como preferido/i);
        expect(starButtons).toHaveLength(3);
    });

    it('should call setPrimaryBudget when clicking star on non-primary budget', async () => {
        mockSetPrimaryMutateAsync.mockResolvedValueOnce({});

        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        // Click the star on a non-primary budget (second one)
        const nonPrimaryStars = screen.getAllByTitle('Marcar como preferido');
        fireEvent.click(nonPrimaryStars[0]);

        await waitFor(() => {
            expect(mockSetPrimaryMutateAsync).toHaveBeenCalledWith({
                budgetId: expect.any(String),
                confirmed: true,
            });
        });
    });

    it('should NOT call setPrimaryBudget when clicking star on already-primary budget', async () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        // Click the star on the primary budget
        const primaryStar = screen.getByTitle('Presupuesto preferido');
        fireEvent.click(primaryStar);

        // Should not trigger mutation
        expect(mockSetPrimaryMutateAsync).not.toHaveBeenCalled();
    });

    it('should have view and edit action buttons for each active budget', () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        const viewButtons = screen.getAllByTitle(/Ver presupuesto/i);
        const editButtons = screen.getAllByTitle(/Editar presupuesto/i);

        expect(viewButtons).toHaveLength(3);
        expect(editButtons).toHaveLength(3);
    });

    it('should order budgets by creation date (newest first)', () => {
        render(
            <BudgetListTab projectId="proj-123" clientName="Test Client" />,
            { wrapper: createWrapper() }
        );

        // Get all budget labels in order
        const labels = screen.getAllByText(/Presupuesto #\d/);
        expect(labels[0].textContent).toBe('Presupuesto #3');
        expect(labels[1].textContent).toBe('Presupuesto #2');
        expect(labels[2].textContent).toBe('Presupuesto #1');
    });
});
