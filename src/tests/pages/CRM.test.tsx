import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CRM from '../../pages/CRM';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { useClients } from '../../hooks/useClients';

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock de Layout para evitar ruido
vi.mock('../../components/layout/Layout', () => ({
    default: ({ children, title }: any) => (
        <div data-testid="layout">
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));

// Mock simplificado de componentes UI que usan Radix
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

vi.mock("../../components/ui/badge", () => ({
    Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('lucide-react', () => ({
    Users: () => <div />,
    Search: () => <div />,
    Plus: () => <div />,
    MoreVertical: () => <div />,
    Mail: () => <div />,
    Euro: () => <div />,
    Building2: () => <div />,
    DollarSign: () => <div />,
    FileText: () => <div />,
    Filter: () => <div />,
    X: () => <div />,
    Loader2: () => <div />,
    Trash2: () => <div />,
    Flame: (props: any) => <div data-testid={props['data-testid']} className="flame-icon" />,
}));

// Mock de useClients
vi.mock('../../hooks/useClients', () => ({
    useClients: vi.fn(),
    useDeleteLead: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
    })),
    useToggleHotLead: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
    })),
}));

// Mock de los modales
vi.mock('../../components/crm/NewLeadModal', () => ({
    __esModule: true,
    default: () => <div data-testid="new-lead-modal" />
}));

vi.mock('../../components/crm/LeadDetailModal', () => ({
    __esModule: true,
    default: () => <div data-testid="lead-detail-modal" />
}));

const renderCRM = () => {
    try {
        return render(
            <BrowserRouter>
                <CRM />
            </BrowserRouter>
        );
    } catch (e) {
        console.error("Render error:", e);
        throw e;
    }
};

describe('Componente CRM - Filtros', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useClients as any).mockReturnValue({
            data: [
                {
                    id: '1',
                    name: 'Juan García',
                    client_status: 'prospect',
                    is_hot_lead: true,
                    NEW_Projects: [{
                        id: 'p1',
                        comercial: 'Andrés',
                        NEW_Budget: [{
                            is_primary: true,
                            model_option: { name: 'Neo' }
                        }]
                    }],
                    NEW_Billing: []
                },
                {
                    id: '2',
                    name: 'Marta Ruiz',
                    client_status: 'client',
                    is_hot_lead: false,
                    NEW_Projects: [{
                        id: 'p2',
                        comercial: 'Marc',
                        NEW_Budget: [{
                            is_primary: true,
                            model_option: { name: 'Neo XL' }
                        }]
                    }],
                    NEW_Billing: []
                }
            ],
            isLoading: false,
            error: null
        });
    });

    it('debería mostrar todos los leads inicialmente', () => {
        renderCRM();
        expect(screen.getByText('Juan García')).toBeInTheDocument();
        expect(screen.getByText('Marta Ruiz')).toBeInTheDocument();
    });

    it('debería filtrar por búsqueda de texto', () => {
        renderCRM();
        const searchInput = screen.getByPlaceholderText(/Buscar contactos/i);

        fireEvent.change(searchInput, { target: { value: 'Marta' } });

        expect(screen.queryByText('Juan García')).not.toBeInTheDocument();
        expect(screen.getByText('Marta Ruiz')).toBeInTheDocument();
    });

    it('debería filtrar por comercial', async () => {
        renderCRM();

        // Abrir el popover de filtros
        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        // Buscar el checkbox de 'Marc'
        const marcCheckbox = screen.getByLabelText('Marc');
        fireEvent.click(marcCheckbox);

        // Verificar que solo queda Marta (que es de Marc)
        expect(screen.queryByText('Juan García')).not.toBeInTheDocument();
        expect(screen.getByText('Marta Ruiz')).toBeInTheDocument();
    });

    it('debería limpiar los filtros al pulsar el botón Limpiar', () => {
        renderCRM();
        const searchInput = screen.getByPlaceholderText(/Buscar contactos/i);
        fireEvent.change(searchInput, { target: { value: 'Marta' } });

        expect(screen.queryByText('Juan García')).not.toBeInTheDocument();

        // Hay dos botones de limpiar (uno en el header de filtros y otro fuera)
        // Usamos getAllByText y clicamos el primero o buscamos por rol
        const clearButtons = screen.getAllByText(/Limpiar/i);
        fireEvent.click(clearButtons[0]);

        expect(screen.getByText('Juan García')).toBeInTheDocument();
    });

    // TEST TDD: Este test debería FALLAR hasta que implementemos el filtro de modelo
    it('debería filtrar por modelo de vehículo (TDD)', () => {
        renderCRM();

        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        // Ahora forzamos que el test falle si no existe
        const neoCheckbox = screen.getByLabelText('Neo');
        fireEvent.click(neoCheckbox);

        // Juan García tiene "Neo", Marta tiene "Neo XL"
        expect(screen.getByText('Juan García')).toBeInTheDocument();
        expect(screen.queryByText('Marta Ruiz')).not.toBeInTheDocument();
    });

    it('debería mostrar icono de fuego para Hot Leads', () => {
        renderCRM();
        // Juan García is_hot_lead: true → should have flame icon
        const hotIcons = screen.getAllByTestId('hot-lead-icon');
        expect(hotIcons.length).toBe(1);
    });

    it('debería filtrar por Hot Lead', () => {
        renderCRM();

        // Abrir el popover de filtros
        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        // Buscar el checkbox de 'Solo Hot Leads'
        const hotLeadCheckbox = screen.getByLabelText(/Solo Hot Leads/i);
        fireEvent.click(hotLeadCheckbox);

        // Solo Juan García es hot lead
        expect(screen.getByText('Juan García')).toBeInTheDocument();
        expect(screen.queryByText('Marta Ruiz')).not.toBeInTheDocument();
    });
});
