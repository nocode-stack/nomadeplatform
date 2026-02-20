import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjects } from '../../hooks/useNewProjects';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Centralized mock builder to ensure method chaining always works
const mockQueryBuilder: any = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'test-project-id', client_id: 'client-id', status: 'prospect' }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => mockQueryBuilder),
        rpc: vi.fn().mockResolvedValue({ data: 'PRO-2026-001', error: null })
    }
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

// Mock useAuth y useUserProfile
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id' }
    })
}));

vi.mock('../../hooks/useUserProfile', () => ({
    useUserProfile: () => ({
        data: { id: 'test-profile-id' },
        isLoading: false
    })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('hook useProjects - createProject', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock implementations to default
        mockQueryBuilder.single.mockResolvedValue({ data: { id: 'test-project-id', client_id: 'client-id', status: 'prospect' }, error: null });
        mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
    });

    it('debería crear un cliente y un proyecto para un nuevo lead (siempre como prospecto)', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Juan Pérez',
            clientEmail: 'juan@example.com',
            clientPhone: '600123456',
            clientType: 'prospect',
            comercial: 'Arnau'
        };

        const newProject = await result.current.createProject(leadData);

        // Verificar creación de cliente y proyecto
        expect(supabase.from).toHaveBeenCalledWith('NEW_Clients');
        expect(supabase.from).toHaveBeenCalledWith('NEW_Projects');

        expect(newProject).toBeDefined();
        // Los nuevos proyectos (Leads) deben tener estado 'prospect'
        expect(newProject.status).toBe('prospect');
    });

    it('debería manejar la información de facturación si se proporciona', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Juan Pérez',
            clientEmail: 'juan@example.com',
            clientPhone: '600123456',
            clientType: 'prospect',
            billingType: 'company',
            billingName: 'Empresa S.L.',
            billingEmail: 'facturacion@empresa.com',
            billingPhone: '912345678',
            billingAddress: 'Calle Falsa 123',
            billingCompanyCif: 'B12345678'
        };

        await result.current.createProject(leadData);

        expect(supabase.from).toHaveBeenCalledWith('NEW_Billing');
    });

    it('debería guardar las especificaciones del proyecto durante el registro del lead', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Juan Pérez',
            clientEmail: 'juan@example.com',
            clientPhone: '600123456',
            clientType: 'prospect',
            vehicleModel: 'Neo',
            motorization: 'Diesel 140cv',
            furnitureColor: 'Madera Natural'
        };

        const newProject = await result.current.createProject(leadData);

        // Esperamos una llamada a NEW_Budget para guardar estas especificaciones
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
        expect(newProject).toBeDefined();
    });

    it('debería manejar errores durante la creación del cliente', async () => {
        mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: { message: 'Error en cliente' } });

        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Usuario Error',
            clientEmail: 'error@example.com',
            clientPhone: '000000000',
            clientType: 'prospect'
        };

        await expect(result.current.createProject(leadData)).rejects.toThrow();
    });

    it('debería redondear los valores monetarios a 2 decimales', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const leadData = {
            clientName: 'Juan Pérez',
            clientEmail: 'juan@example.com',
            discount: '5.5555'
        };

        await result.current.createProject(leadData);

        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
        // discount_percentage should be rounded to 2 decimals: 5.5555% / 100 = 0.055555 → rounded to 0.06
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
            discount_percentage: 0.06
        }));
    });
});

describe('hook useProjects - updateProject', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockQueryBuilder.single.mockResolvedValue({ data: { id: 'test-project-id', client_id: 'client-id', status: 'prospect' }, error: null });
        mockQueryBuilder.maybeSingle.mockResolvedValue({ data: { id: 'test-project-id', client_id: 'client-id', status: 'prospect' }, error: null });
    });

    it('debería actualizar los datos básicos del cliente', async () => {
        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            clientName: 'Juan Pérez Actualizado',
            clientEmail: 'juan_nuevo@example.com'
        };

        await result.current.updateProject('test-project-id', updateData);

        expect(supabase.from).toHaveBeenCalledWith('NEW_Clients');
        expect(supabase.from('NEW_Clients').update).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Juan Pérez Actualizado',
            email: 'juan_nuevo@example.com'
        }));
    });

    it('debería actualizar la información de facturación si existe', async () => {
        mockQueryBuilder.maybeSingle.mockImplementation((table: any) => {
            return Promise.resolve({ data: { id: 'billing-id' }, error: null });
        });

        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            billingName: 'Nueva Razón Social',
            billingType: 'company'
        };

        await result.current.updateProject('test-project-id', updateData);

        expect(supabase.from).toHaveBeenCalledWith('NEW_Billing');
        expect(supabase.from('NEW_Billing').update).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Nueva Razón Social'
        }));
    });

    it('debería actualizar las especificaciones en el presupuesto primario', async () => {
        mockQueryBuilder.maybeSingle.mockResolvedValue({ data: { id: 'budget-id', name: 'Neo' }, error: null });

        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            vehicleModel: 'Neo',
            motorization: 'Diesel 140cv'
        };

        await result.current.updateProject('test-project-id', updateData);

        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
    });

    it('debería forzar la creación de un nuevo presupuesto si forceNewBudget es true', async () => {
        // Mock de presupuesto primario existente sin cambios
        mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
            data: {
                id: 'existing-budget-id',
                model_option_id: 'existing-model-id',
                is_primary: true
            },
            error: null
        });

        // Mock de opciones (modelos, motores, etc) para que devuelvan IDs
        mockQueryBuilder.select.mockImplementation((table: string) => {
            return mockQueryBuilder;
        });

        const { result } = renderHook(() => useProjects(), {
            wrapper: createWrapper()
        });

        const updateData = {
            vehicleModel: 'Neo',
            forceNewBudget: true
        };

        await result.current.updateProject('test-project-id', updateData);

        // Debería haber un insert en NEW_Budget
        expect(supabase.from).toHaveBeenCalledWith('NEW_Budget');
        expect(mockQueryBuilder.insert).toHaveBeenCalled();
    });
});
