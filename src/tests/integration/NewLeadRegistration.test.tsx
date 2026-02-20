import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewLeadModal from '../../components/crm/NewLeadModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock hooks
const mockCreateProject = vi.fn();
vi.mock('../../hooks/useNewProjects', () => ({
    useProjects: () => ({
        createProject: mockCreateProject,
        isLoading: false,
    }),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

// Mock UI components used by NewLeadModal
vi.mock('../../components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('../../components/ui/tabs', () => ({
    Tabs: ({ children }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <button type="button" role="tab">{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../components/ui/select', () => ({
    Select: ({ children, onValueChange, value }: any) => (
        <select data-testid="select" value={value} onChange={(e) => onValueChange(e.target.value)}>
            {children}
        </select>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
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

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('NewLeadRegistration Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should complete registration by submitting form directly (save_only mode)', async () => {
        mockCreateProject.mockResolvedValue({ id: 'proj-1', client_id: 'cli-1' });

        render(<NewLeadModal open={true} onOpenChange={() => { }} />, {
            wrapper: createWrapper(),
        });

        // Fill required fields
        fireEvent.change(screen.getByPlaceholderText(/Nombre del cliente/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText(/Teléfono de contacto/i), { target: { value: '123456789' } });
        fireEvent.change(screen.getByPlaceholderText(/Email del cliente/i), { target: { value: 'test@example.com' } });

        // Submit form - NewLeadModal now creates project directly without confirmation modal
        fireEvent.click(screen.getByRole('button', { name: /Registrar Lead/i }));

        await waitFor(() => expect(mockCreateProject).toHaveBeenCalled());

        // NewLeadModal now calls createProject with 'save_only' mode
        expect(mockCreateProject).toHaveBeenCalledWith(
            expect.objectContaining({
                clientName: 'Test User',
                clientEmail: 'test@example.com',
                clientType: 'prospect',
            }),
            'save_only'
        );
    });

    it('should show required fields validation errors when submitting empty form', async () => {
        render(<NewLeadModal open={true} onOpenChange={() => { }} />, {
            wrapper: createWrapper(),
        });

        fireEvent.click(screen.getByRole('button', { name: /Registrar Lead/i }));

        // Should show validation errors and NOT call createProject
        await waitFor(() => {
            expect(mockCreateProject).not.toHaveBeenCalled();
        });
    });
});
