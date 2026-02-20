import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProyectoDetalle from '../../pages/ProyectoDetalle';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { useUnifiedProject } from '../../hooks/useUnifiedProjects';
import { useProject } from '../../hooks/useNewProjects';
import { useNewIncidentsList } from '../../hooks/useNewIncidents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'test-proj-id' })
    };
});

// Mock Layout
vi.mock('../../components/layout/Layout', () => ({
    default: ({ children, title }: any) => (
        <div data-testid="layout">
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));

// Mock Hooks
vi.mock('../../hooks/useUnifiedProjects', () => ({
    useUnifiedProject: vi.fn(),
    useProjectPhases: vi.fn(() => ({
        phases: [],
        isLoading: false
    }))
}));
vi.mock('../../hooks/useNewProjects', () => ({
    useProject: vi.fn(),
    useProjectPhases: vi.fn(() => ({
        phases: [],
        isLoading: false,
        updatePhase: vi.fn(),
        isUpdating: false
    }))
}));
vi.mock('../../hooks/useNewIncidents', () => ({
    useNewIncidentsList: vi.fn()
}));
vi.mock('../../hooks/useProjectTabsAccess', () => ({
    useProjectTabsAccess: vi.fn(() => ({
        allowedTabs: [
            { id: 'resumen', label: 'Resumen' },
            { id: 'informacion', label: 'Información' },
            { id: 'presupuestos', label: 'Presupuestos' }
        ],
        canAccessTab: (tab: string) => ['resumen', 'informacion', 'presupuestos'].includes(tab),
        isProspect: true
    }))
}));

// Mock Supabase to prevent real calls
vi.mock('../../integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
    }
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const renderPage = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ProyectoDetalle />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('ProyectoDetalle Page', () => {
    const mockProject = {
        id: 'test-proj-id',
        code: 'PR-001',
        name: 'Proyecto de Prueba',
        model: 'Neo',
        status: 'prospect',
        progress: 10,
        new_clients: {
            id: 'client-1',
            name: 'Juan Test',
            client_status: 'prospect',
            client_code: 'PC-001'
        },
        clients: {
            name: 'Juan Test',
            phone: '123456789',
            email: 'juan@test.com'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useUnifiedProject as any).mockReturnValue({
            data: mockProject,
            isLoading: false,
            error: null,
            refetch: vi.fn()
        });
        (useProject as any).mockReturnValue({
            data: mockProject
        });
        (useNewIncidentsList as any).mockReturnValue({
            data: [],
            isLoading: false,
            refetch: vi.fn()
        });
    });

    it('should render project header with correct info', () => {
        renderPage();

        // For prospects, it should show client_code PC-001 in breadcrumbs and header
        const codes = screen.getAllByText('PC-001');
        expect(codes.length).toBeGreaterThan(0);
        expect(screen.getAllByText('Juan Test').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Neo').length).toBeGreaterThan(0);
    });

    it('should show restricted tabs as locked for prospects', () => {
        renderPage();

        // Incidencias should be locked for prospects according to page logic
        const incidentsTab = screen.getByText(/Incidencias/i);
        expect(incidentsTab).toBeInTheDocument();
        const locks = screen.getAllByText('🔒', { exact: false });
        expect(locks.length).toBeGreaterThan(0);
    });

    it('should navigate between tabs', async () => {
        renderPage();

        const infoButton = screen.getByText('Información');
        fireEvent.click(infoButton);

        // Information page title
        expect(screen.getByText('Información del Proyecto')).toBeInTheDocument();
    });

    it('should show "Cargando..." state', () => {
        (useUnifiedProject as any).mockReturnValue({
            isLoading: true
        });

        renderPage();
        expect(screen.getByText(/Cargando proyecto/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
        (useUnifiedProject as any).mockReturnValue({
            error: { message: 'Failed to fetch' },
            isLoading: false
        });

        renderPage();
        expect(screen.getByText(/Error al cargar el proyecto/i)).toBeInTheDocument();
    });
});
