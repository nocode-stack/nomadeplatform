import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InviteUserModal } from './InviteUserModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock de Supabase Edge Functions
const mockInvoke = vi.hoisted(() => vi.fn((...args) => {
    console.log('🔥 mockInvoke called with:', JSON.stringify(args, null, 2));
    return Promise.resolve({ data: { success: true }, error: null });
}));

vi.mock('../../integrations/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: mockInvoke,
        },
    },
}));

// Mock de toast global
const mockToast = vi.fn();
vi.mock("../../hooks/use-toast", () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

// Mocks de UI components
vi.mock("../../components/ui/dialog", () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../../components/ui/button", () => ({
    Button: ({ children, onClick, type, disabled }: any) => (
        <button onClick={onClick} type={type} disabled={disabled}>
            {children}
        </button>
    ),
}));

vi.mock("../../components/ui/input", () => ({
    Input: (props: any) => <input {...props} />,
}));

vi.mock("../../components/ui/label", () => ({
    Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("../../components/ui/select", () => ({
    Select: ({ children, value, onValueChange, required }: any) => {
        // En un select real de HTML, solo puede haber opciones. 
        // Filtramos para que SelectContent/SelectItem se rendericen.
        return (
            <select
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                data-testid="select"
                required={required}
            >
                <option value="">Seleccionar</option>
                {children}
            </select>
        );
    },
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
    SelectTrigger: () => null, // Ignoramos el trigger en el mock de select nativo
    SelectValue: () => null,
}));

const renderInviteModal = (props = { isOpen: true, onClose: vi.fn() }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <InviteUserModal {...props} />
        </QueryClientProvider>
    );
};

describe('InviteUserModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debería renderizar correctamente el modal', () => {
        renderInviteModal();
        expect(screen.getByRole('heading', { name: /Enviar Invitación/i })).toBeDefined();
        expect(screen.getByLabelText(/Nombre Completo/i)).toBeDefined();
    });

    it('debería enviar la invitación correctamente con cualquier dominio', async () => {
        mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
        const onClose = vi.fn();

        renderInviteModal({ isOpen: true, onClose });

        fireEvent.change(screen.getByPlaceholderText(/Ej. Juan Pérez/i), { target: { value: 'Juan Perez' } });
        fireEvent.change(screen.getByPlaceholderText(/juan@example.com/i), { target: { value: 'otro@gmail.com' } });

        const selects = screen.getAllByTestId('select');
        fireEvent.change(selects[0], { target: { value: 'Operario' } });
        fireEvent.change(selects[1], { target: { value: 'operator' } });

        fireEvent.click(screen.getByRole('button', { name: /^Enviar Invitación$/i }));

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('invite-user', {
                body: expect.objectContaining({
                    email: 'otro@gmail.com',
                    name: 'Juan Perez',
                    department: 'Operario',
                    role: 'operator',
                }),
            });
        }, { timeout: 4000 });

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Invitación enviada",
            }));
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('debería manejar errores de la Edge Function', async () => {
        // Simular un error de red o de la función
        mockInvoke.mockRejectedValueOnce(new Error('Api Error'));

        renderInviteModal();

        fireEvent.change(screen.getByPlaceholderText(/Ej. Juan Pérez/i), { target: { value: 'Juan Perez' } });
        fireEvent.change(screen.getByPlaceholderText(/juan@example.com/i), { target: { value: 'juan@example.com' } });

        const selects = screen.getAllByTestId('select');
        fireEvent.change(selects[0], { target: { value: 'Operario' } });
        fireEvent.change(selects[1], { target: { value: 'operator' } });

        fireEvent.click(screen.getByRole('button', { name: /^Enviar Invitación$/i }));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Error al invitar",
                variant: "destructive",
            }));
        }, { timeout: 4000 });
    });
});
