import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Presupuestos from '../../pages/Presupuestos';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase client to avoid env var errors in test
vi.mock('../../integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        functions: { invoke: vi.fn() },
    },
}));

// Mock useRegionalPricing hook
vi.mock('../../hooks/useRegionalPricing', () => ({
    useRegionalConfig: () => ({ data: [], isLoading: false }),
    getPrice: () => 0,
    getRegionalIva: () => ({ rate: 21, label: 'IVA' }),
    getRegionalIedmt: () => ({ applies: true, autoAmount: 4600, manualAmount: 4300 }),
    getRegionalLegalText: () => [],
}));

// Mock de useNewBudgets
const mockBudgets = [
    {
        id: '1',
        budget_code: 'PRE-001',
        is_primary: true,
        total: 50000,
        created_at: '2024-01-01',
        client: { name: 'Cliente A' },
        model_option: { name: 'Neo' }
    },
    {
        id: '2',
        budget_code: 'PRE-002',
        is_primary: false,
        total: 60000,
        created_at: '2024-01-02',
        client: { name: 'Cliente B' },
        model_option: { name: 'Neo XL' }
    }
];

vi.mock('../../hooks/useNewBudgets', () => ({
    useNewBudgets: () => ({
        data: mockBudgets,
        isLoading: false
    }),
    useNewBudgetItems: () => ({
        data: [],
        isLoading: false
    })
}));

// Mock de Layout
vi.mock('../../components/layout/Layout', () => ({
    default: ({ children, title }: any) => (
        <div data-testid="layout">
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));

// Mock simplificado de componentes UI
vi.mock("../../components/ui/button", () => ({
    Button: ({ children, onClick, variant, title }: any) => (
        <button onClick={onClick} data-variant={variant} title={title}>{children}</button>
    ),
}));

vi.mock("../../components/ui/card", () => ({
    Card: ({ children, onClick }: any) => (
        <div onClick={onClick} data-testid="card">{children}</div>
    ),
}));

vi.mock("../../components/ui/badge", () => ({
    Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("../../components/ui/input", () => ({
    Input: ({ value, onChange, placeholder, className }: any) => (
        <input value={value} onChange={onChange} placeholder={placeholder} className={className} />
    ),
}));

vi.mock("../../components/ui/switch", () => ({
    Switch: ({ checked, onCheckedChange, id }: any) => (
        <input
            type="checkbox"
            role="switch"
            id={id}
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
        />
    ),
}));

vi.mock("../../components/ui/label", () => ({
    Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("lucide-react", () => ({
    Search: () => <div />,
    FileText: () => <div />,
    Star: () => <div />,
    Loader2: () => <div />,
    Eye: () => <div />,
    Plus: () => <div />,
    Download: () => <div />,
    Send: () => <div />,
    Pencil: () => <div />,
}));

// Mock BudgetPrintView
vi.mock('../../components/crm/BudgetPrintView', () => ({
    default: () => <div data-testid="budget-print-view" />,
}));

// Mock BudgetEditorModal
vi.mock('../../components/crm/BudgetEditorModal', () => ({
    default: () => <div data-testid="budget-editor-modal" />,
}));

// Mock del modal de detalle
vi.mock('../../components/budgets/BudgetDetailModal', () => ({
    default: () => <div data-testid="budget-detail-modal" />
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderPresupuestos = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Presupuestos />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('Componente Presupuestos - Filtros', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debería mostrar todos los presupuestos inicialmente', () => {
        renderPresupuestos();
        expect(screen.getByText('Cliente A')).toBeInTheDocument();
        expect(screen.getByText('Cliente B')).toBeInTheDocument();
    });

    it('debería filtrar por búsqueda de texto', () => {
        renderPresupuestos();
        const searchInput = screen.getByPlaceholderText(/Buscar por código o cliente/i);

        fireEvent.change(searchInput, { target: { value: 'Cliente A' } });

        expect(screen.getByText('Cliente A')).toBeInTheDocument();
        expect(screen.queryByText('Cliente B')).not.toBeInTheDocument();
    });

    it('debería filtrar por "Solo Actuales"', () => {
        renderPresupuestos();
        const primarySwitch = screen.getByRole('switch');

        fireEvent.click(primarySwitch);

        expect(screen.getByText('Cliente A')).toBeInTheDocument();
        expect(screen.queryByText('Cliente B')).not.toBeInTheDocument();
    });

    it('debería filtrar por modelo', () => {
        renderPresupuestos();

        // The page now has a <select> with aria-label="modelo"
        const modelSelect = screen.getByTitle('Filtrar por modelo');

        fireEvent.change(modelSelect, { target: { value: 'Neo' } });

        expect(screen.getByText('Cliente A')).toBeInTheDocument();
        expect(screen.queryByText('Cliente B')).not.toBeInTheDocument();
    });
});
