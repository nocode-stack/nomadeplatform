import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Contratos from '../../pages/Contratos';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock env variables for Supabase client
vi.stubEnv('VITE_SUPABASE_URL', 'https://mock.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'mock-key');

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
vi.mock("../../components/ui/popover", () => ({
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
    PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../../components/ui/checkbox", () => ({
    Checkbox: ({ id, checked, onCheckedChange }: any) => (
        <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
        />
    ),
}));

vi.mock("../../components/ui/label", () => ({
    Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("../../components/ui/button", () => ({
    Button: ({ children, onClick, variant }: any) => (
        <button onClick={onClick} data-variant={variant}>{children}</button>
    ),
}));

vi.mock("lucide-react", () => ({
    Plus: () => <div />,
    ExternalLink: () => <div />,
    ShieldCheck: () => <div />,
    History: () => <div />,
    FileSignature: () => <div />,
    Search: () => <div />,
    Filter: () => <div />,
    X: () => <div />,
    Send: () => <div />,
    Star: () => <div />,
    Handshake: () => <div />,
    Bookmark: () => <div />,
    FileCheck: () => <div />,
    FileText: () => <div />,
    Loader2: () => <div />,
}));

// Mock useAllContracts to avoid needing real QueryClient data fetching
vi.mock('../../hooks/useAllContracts', () => ({
    useAllContracts: vi.fn(),
}));

import { useAllContracts } from '../../hooks/useAllContracts';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

const mockContracts = [
    {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        client_full_name: 'Nomad Life',
        contract_type: 'reservation',
        estado_visual: 'signed',
        is_latest: true,
        vehicle_model: 'Neo',
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-10T00:00:00Z',
        project: {
            project_code: 'PR-001',
            new_clients: { name: 'Nomad Life' },
            budgets: [{ is_primary: true, budget_code: 'BU-001' }],
        },
    },
    {
        id: 'ffffffff-1111-2222-3333-444444444444',
        client_full_name: 'Camping Sol',
        contract_type: 'purchase_agreement',
        estado_visual: 'editing',
        is_latest: false,
        vehicle_model: 'Neo XL',
        created_at: '2024-05-01T00:00:00Z',
        updated_at: '2024-05-10T00:00:00Z',
        project: {
            project_code: 'PR-002',
            new_clients: { name: 'Camping Sol' },
            budgets: [{ is_primary: true, budget_code: 'BU-002' }],
        },
    },
    {
        id: '99999999-8888-7777-6666-555555555555',
        client_full_name: 'Pedro Lopez',
        contract_type: 'sale_contract',
        estado_visual: 'sent',
        is_latest: true,
        vehicle_model: 'Neo',
        created_at: '2024-04-01T00:00:00Z',
        updated_at: '2024-04-10T00:00:00Z',
        project: {
            project_code: 'PR-003',
            new_clients: { name: 'Pedro Lopez' },
            budgets: [{ is_primary: true, budget_code: 'BU-003' }],
        },
    },
];

describe('Componente Contratos - Filtros', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAllContracts as any).mockReturnValue({
            data: mockContracts,
            isLoading: false,
        });
    });

    it('debería mostrar todos los contratos inicialmente', () => {
        render(<Contratos />, { wrapper: createWrapper() });
        expect(screen.getByText('Nomad Life')).toBeInTheDocument();
        expect(screen.getByText('Camping Sol')).toBeInTheDocument();
        expect(screen.getByText('Pedro Lopez')).toBeInTheDocument();
    });

    it('debería filtrar por búsqueda de texto (cliente)', () => {
        render(<Contratos />, { wrapper: createWrapper() });
        const searchInput = screen.getByPlaceholderText(/Buscar por cliente o ID/i);

        fireEvent.change(searchInput, { target: { value: 'Nomad' } });

        expect(screen.getByText('Nomad Life')).toBeInTheDocument();
        expect(screen.queryByText('Camping Sol')).not.toBeInTheDocument();
    });

    it('debería filtrar por "Solo actuales"', () => {
        render(<Contratos />, { wrapper: createWrapper() });

        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        const currentCheckbox = screen.getByLabelText(/Solo actuales/i);
        fireEvent.click(currentCheckbox);

        // Nomad Life (is_latest=true) and Pedro Lopez (is_latest=true) stay
        expect(screen.getByText('Nomad Life')).toBeInTheDocument();
        expect(screen.queryByText('Camping Sol')).not.toBeInTheDocument();
    });

    it('debería filtrar por tipo de contrato', () => {
        render(<Contratos />, { wrapper: createWrapper() });

        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        const typeCheckbox = screen.getByLabelText('Acuerdo Compraventa');
        fireEvent.click(typeCheckbox);

        expect(screen.getByText('Camping Sol')).toBeInTheDocument();
        expect(screen.queryByText('Nomad Life')).not.toBeInTheDocument();
    });

    it('debería limpiar los filtros', () => {
        render(<Contratos />, { wrapper: createWrapper() });
        const searchInput = screen.getByPlaceholderText(/Buscar por cliente o ID/i);
        fireEvent.change(searchInput, { target: { value: 'Nomad' } });

        expect(screen.queryByText('Camping Sol')).not.toBeInTheDocument();

        const clearButtons = screen.getAllByText(/Limpiar/i);
        fireEvent.click(clearButtons[clearButtons.length - 1]);

        expect(screen.getByText('Camping Sol')).toBeInTheDocument();
    });

    it('debería filtrar por modelo de vehículo (TDD)', () => {
        render(<Contratos />, { wrapper: createWrapper() });

        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        const neoCheckbox = screen.getByLabelText('Neo');
        fireEvent.click(neoCheckbox);

        // Nomad Life and Pedro Lopez have "Neo", Camping Sol has "Neo XL"
        expect(screen.getByText('Nomad Life')).toBeInTheDocument();
        expect(screen.queryByText('Camping Sol')).not.toBeInTheDocument();
    });
});
