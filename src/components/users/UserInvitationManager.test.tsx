import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserInvitationManager } from './UserInvitationManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const { mockUsers } = vi.hoisted(() => ({
    mockUsers: [
        { id: '1', name: 'Juan Perez', email: 'juan@nomade.com', department: 'Ventas', role: 'comercial', status: 'active', created_at: '2024-01-01' },
        { id: '2', name: 'Maria Garcia', email: 'maria@nomade.com', department: 'Dirección', role: 'admin', status: 'pending', created_at: '2024-01-02' },
        { id: '3', name: 'Pedro Luis', email: 'pedro@gmail.com', department: 'Ventas', role: 'comercial', status: 'active', created_at: '2024-01-03' },
    ]
}));

// Mock de Supabase
vi.mock('../../integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
        })),
    },
}));

// Mock de UI components
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
    Label: ({ children, htmlFor, className }: any) => <label htmlFor={htmlFor} className={className}>{children}</label>,
}));

vi.mock("../../components/ui/button", () => ({
    Button: ({ children, onClick, variant, className }: any) => (
        <button onClick={onClick} data-variant={variant} className={className}>{children}</button>
    ),
}));

vi.mock("../../components/ui/card", () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("../../components/ui/badge", () => ({
    Badge: ({ children, variant, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock("../../hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

vi.mock("./InviteUserModal", () => ({
    InviteUserModal: () => <div data-testid="invite-modal" />,
}));

vi.mock("../../components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
    DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

// Mock de React Query para devolver los datos
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn().mockReturnValue({
            data: mockUsers,
            isLoading: false,
            error: null,
        }),
        useMutation: vi.fn().mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        }),
    };
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderUserInvitationManager = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <UserInvitationManager />
        </QueryClientProvider>
    );
};

describe('UserInvitationManager - Filtros', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debería mostrar todos los usuarios inicialmente', () => {
        renderUserInvitationManager();
        expect(screen.getByText('Juan Perez')).toBeInTheDocument();
        expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
    });

    it('debería filtrar por búsqueda (nombre)', () => {
        renderUserInvitationManager();
        const searchInput = screen.getByPlaceholderText(/Buscar usuarios/i);
        fireEvent.change(searchInput, { target: { value: 'Maria' } });

        expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
        expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
    });

    it('debería filtrar por departamento', async () => {
        renderUserInvitationManager();

        // Abrir filtros
        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        // Buscar el checkbox de 'Dirección'
        const direccionCheckbox = screen.getByLabelText('Dirección');
        fireEvent.click(direccionCheckbox);

        expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
        expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
    });

    it('debería filtrar por estado (pendiente)', async () => {
        renderUserInvitationManager();

        const filterButton = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(filterButton);

        const pendingCheckbox = screen.getByLabelText('Pendiente');
        fireEvent.click(pendingCheckbox);

        expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
        expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
    });

    it('debería limpiar los filtros', () => {
        renderUserInvitationManager();
        const searchInput = screen.getByPlaceholderText(/Buscar usuarios/i);
        fireEvent.change(searchInput, { target: { value: 'Juan' } });

        expect(screen.queryByText('Maria Garcia')).not.toBeInTheDocument();

        // Botón de limpiar (hay dos, usamos el que está fuera del popover si es necesario, o getAll)
        const clearButtons = screen.getAllByRole('button', { name: /Limpiar/i });
        fireEvent.click(clearButtons[0]);

        expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
    });

    it('debería mostrar la opción "Dar de baja" en el menú de usuario', async () => {
        renderUserInvitationManager();

        // El botón de los tres puntos (MoreVertical)
        const moreButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
        // El primer usuario es Juan Perez, tiene el botón de menú
        fireEvent.click(moreButtons[1]); // moreButtons[0] es el de filtros, [1] es el de Juan

        const deactivateButtons = screen.getAllByText(/Dar de baja/i);
        expect(deactivateButtons[0]).toBeInTheDocument();
    });
});
