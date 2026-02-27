import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SendBudgetEmailDialog from '../../components/budgets/SendBudgetEmailDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
        },
    },
}));

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({ user: { id: 'user-1', email: 'admin@nomade.com' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

// Mock UI components
vi.mock('../../components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../components/ui/input', () => ({
    Input: (props: any) => <input {...props} />,
}));

vi.mock('../../components/ui/button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('../../components/ui/textarea', () => ({
    Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('lucide-react', () => ({
    Mail: () => <div />,
    Loader2: () => <div />,
    Send: () => <div />,
    CheckCircle2: () => <div />,
    AlertCircle: () => <div />,
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('Budget Send Email Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the send email dialog when open', () => {
        render(
            <SendBudgetEmailDialog
                open={true}
                onOpenChange={vi.fn()}
                clientEmail="test@example.com"
                clientName="Juan Test"
                budgetCode="PRE-001"
                totalFormatted="50.000 €"
                modelName="Neo"
                engineName="Diesel 150CV"
                packName="Adventure"
                generatePdf={async () => 'data:application/pdf;base64,...'}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should pre-fill client email in the form', () => {
        render(
            <SendBudgetEmailDialog
                open={true}
                onOpenChange={vi.fn()}
                clientEmail="juan@test.com"
                clientName="Juan Test"
                budgetCode="PRE-001"
                totalFormatted="50.000 €"
                modelName="Neo"
                engineName="Diesel 150CV"
                packName="Adventure"
                generatePdf={async () => null}
            />,
            { wrapper: createWrapper() }
        );

        const emailInput = screen.getByDisplayValue('juan@test.com');
        expect(emailInput).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
        render(
            <SendBudgetEmailDialog
                open={false}
                onOpenChange={vi.fn()}
                clientEmail="test@example.com"
                clientName="Juan Test"
                budgetCode="PRE-001"
                totalFormatted="50.000 €"
                modelName="Neo"
                engineName="Diesel 150CV"
                packName="Adventure"
                generatePdf={async () => null}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
});
