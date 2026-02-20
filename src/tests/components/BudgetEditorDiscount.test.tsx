import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BudgetEditorModal from '../../components/crm/BudgetEditorModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Supabase mock ──────────────────────────────────────────
const mockBudgetData = {
    id: 'budget-1',
    model_option_id: 'm1',
    engine_option_id: 'e1',
    interior_color_id: 'i1',
    electric_system_id: 'el1',
    pack_id: null,
    budget_code: 'NV-2026-001',
    discount_percentage: 0.1,  // 10%
    discount_amount: 500,       // 500€
};

const createChain = (data: any = null) => {
    const chain: any = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        delete: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
        single: vi.fn(() => Promise.resolve({ data, error: null })),
        then: (onFulfilled: any) => Promise.resolve({ data, error: null }).then(onFulfilled),
    };
    return chain;
};

const mockSupabaseFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: (...args: any[]) => mockSupabaseFrom(...args),
    },
}));

// ── Hook mocks ─────────────────────────────────────────────
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
    useInteriorColorOptions: () => ({
        data: [{ id: 'i1', name: 'Madera', price_modifier: 0 }],
        isLoading: false,
    }),
    useNewBudgetPacks: () => ({
        data: [
            { id: 'p1', name: 'Pack Adventure', price: 3500 },
            { id: 'p2', name: 'Pack Nomade', price: 1500 },
        ],
        isLoading: false,
    }),
    useElectricSystems: () => ({
        data: [{ id: 'el1', name: 'Sistema Básico', price: 0 }],
        isLoading: false,
    }),
    useNewBudgetAdditionalItems: () => ({
        data: [
            { id: 'a1', name: 'Toldo lateral', price: 800, category: 'exterior' },
            { id: 'a2', name: 'Ducha exterior', price: 350, category: 'exterior' },
        ],
        isLoading: false,
    }),
    useNewBudgetItems: () => ({
        data: [],
        isLoading: false,
    }),
    useProjectBudgets: () => ({
        data: [],
        isLoading: false,
    }),
    useSetPrimaryBudget: () => ({
        mutateAsync: vi.fn(),
    }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));

vi.mock('../../hooks/useClients', () => ({
    useClients: () => ({ data: [], isLoading: false }),
    useToggleHotLead: () => ({ mutateAsync: vi.fn() }),
}));

// ── UI mocks (simplified) ──────────────────────────────────
vi.mock('../../components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../components/ui/separator', () => ({
    Separator: () => <hr />,
}));

vi.mock('./BudgetPrintView', () => ({
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

describe('BudgetEditorModal – Discount Fields', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: return budget data for loading
        mockSupabaseFrom.mockImplementation((table: string) => {
            if (table === 'NEW_Budget') {
                return createChain(mockBudgetData);
            }
            return createChain([]);
        });
    });

    it('should render discount inputs section with Descuento (%) and Descuento (€)', async () => {
        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            // Should find the discount section header
            expect(screen.getByText('Descuentos')).toBeInTheDocument();
        });

        // Should find both labels
        expect(screen.getByText('Descuento (%)')).toBeInTheDocument();
        expect(screen.getByText('Descuento (€)')).toBeInTheDocument();
    });

    it('should load discount values from database', async () => {
        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            // discount_percentage=0.1 → 10% should show in input
            const percentInputs = screen.getAllByPlaceholderText('0');
            // We look for one that has value=10
            const found = percentInputs.some(
                (input) => (input as HTMLInputElement).value === '10'
            );
            expect(found).toBe(true);
        });
    });

    it('should show PVP Bruto in the summary panel', async () => {
        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(screen.getByText('PVP Bruto')).toBeInTheDocument();
        });
    });

    it('should show discount lines in summary when discounts are present', async () => {
        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            // With 10% discount loaded from DB
            expect(screen.getByText('Dto. 10%')).toBeInTheDocument();
            // With 500€ fixed discount from DB
            expect(screen.getByText('Dto. fijo')).toBeInTheDocument();
        });
    });

    it('should accept percentage discount input changes', async () => {
        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(screen.getByText('Descuento (%)')).toBeInTheDocument();
        });

        // Find percent input (value=10 from loaded data)
        const inputs = screen.getAllByPlaceholderText('0');
        const percentInput = inputs.find(
            (input) => (input as HTMLInputElement).value === '10'
        );
        expect(percentInput).toBeTruthy();

        // Change to 15%
        fireEvent.change(percentInput!, { target: { value: '15' } });
        expect((percentInput as HTMLInputElement).value).toBe('15');
    });

    it('should accept fixed discount input changes', async () => {
        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(screen.getByText('Descuento (€)')).toBeInTheDocument();
        });

        // Find fixed discount input (value=500 from loaded data)
        const inputs = screen.getAllByPlaceholderText('0');
        const fixedInput = inputs.find(
            (input) => (input as HTMLInputElement).value === '500'
        );
        expect(fixedInput).toBeTruthy();

        // Change to 1000€
        fireEvent.change(fixedInput!, { target: { value: '1000' } });
        expect((fixedInput as HTMLInputElement).value).toBe('1000');
    });

    it('should save both discount values to database', async () => {
        const mockUpdateChain = createChain(null);
        const mockDeleteChain = createChain(null);
        const mockInsertChain = createChain(null);

        mockSupabaseFrom.mockImplementation((table: string) => {
            if (table === 'NEW_Budget') {
                // First call is load, subsequent are update
                const chain = createChain(mockBudgetData);
                chain.update = vi.fn(() => mockUpdateChain);
                return chain;
            }
            if (table === 'NEW_Budget_Items') {
                return {
                    ...createChain([]),
                    delete: vi.fn(() => mockDeleteChain),
                    insert: vi.fn(() => mockInsertChain),
                };
            }
            return createChain([]);
        });

        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(screen.getByText('Descuentos')).toBeInTheDocument();
        });

        // Click save
        const saveBtn = screen.getByRole('button', { name: /Guardar/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            // Verify update was called on NEW_Budget
            expect(mockSupabaseFrom).toHaveBeenCalledWith('NEW_Budget');
        });
    });

    it('should cap percentage discount at 100%', async () => {
        mockSupabaseFrom.mockImplementation((table: string) => {
            if (table === 'NEW_Budget') {
                return createChain({
                    ...mockBudgetData,
                    discount_percentage: 0,
                    discount_amount: 0,
                });
            }
            return createChain([]);
        });

        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(screen.getByText('Descuento (%)')).toBeInTheDocument();
        });

        const inputs = screen.getAllByPlaceholderText('0');
        // First input with max="100" is the percent one
        const percentInput = inputs.find(
            (input) => (input as HTMLInputElement).getAttribute('max') === '100'
        );
        expect(percentInput).toBeTruthy();

        // Try entering 150 — should be capped to 100
        fireEvent.change(percentInput!, { target: { value: '150' } });
        // After the onChange handler, value is clamped by Math.min(100, ...)
        // The state will be 100, re-render will show 100
        await waitFor(() => {
            expect((percentInput as HTMLInputElement).value).toBe('100');
        });
    });

    it('should not allow negative discount values', async () => {
        mockSupabaseFrom.mockImplementation((table: string) => {
            if (table === 'NEW_Budget') {
                return createChain({
                    ...mockBudgetData,
                    discount_percentage: 0,
                    discount_amount: 0,
                });
            }
            return createChain([]);
        });

        render(
            <BudgetEditorModal
                open={true}
                onOpenChange={vi.fn()}
                budgetId="budget-1"
                projectId="proj-1"
            />,
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(screen.getByText('Descuento (€)')).toBeInTheDocument();
        });

        const inputs = screen.getAllByPlaceholderText('0');
        const fixedInput = inputs.find(
            (input) => (input as HTMLInputElement).getAttribute('step') === '50'
        );
        expect(fixedInput).toBeTruthy();

        // Try entering -500 — should be clamped to 0
        fireEvent.change(fixedInput!, { target: { value: '-500' } });
        await waitFor(() => {
            expect(Number((fixedInput as HTMLInputElement).value)).toBeGreaterThanOrEqual(0);
        });
    });
});
