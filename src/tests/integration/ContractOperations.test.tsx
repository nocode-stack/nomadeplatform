import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContractVersioning } from '../../hooks/useContractVersioning';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Reusable mock objects
const mockRpc = vi.fn(() => Promise.resolve({ data: 'new-contract-id', error: null }));
const mockUpdate = vi.fn();

const mockFrom = vi.fn((_table: string) => {
    const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        single: vi.fn(() => Promise.resolve({
            data: {
                id: 'contract-1',
                version: 1,
                estado_visual: 'draft',
                name: 'Test Client',
                budgets: [{ id: 'bud-1', is_primary: true, model_option: { name: 'Neo' }, engine_option: { name: 'Diesel' } }],
                vehicles: []
            },
            error: null
        })),
        update: (...args: any[]) => {
            mockUpdate(...args);
            return {
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: { id: 'contract-1' }, error: null }))
                    })),
                    then: (cb: any) => Promise.resolve({ error: null }).then(cb)
                }))
            };
        },
        then: (cb: any) => Promise.resolve({
            data: { id: 'contract-1', name: 'Test', budgets: [], vehicles: [] },
            error: null
        }).then(cb),
    };
    return chain;
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((table: string) => mockFrom(table)),
        rpc: vi.fn((fnName: string, params: any) => mockRpc(fnName, params))
    }
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('Contract Fields Fill & Save Flow', () => {
    const projectId = 'proj-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call generate_contract_version RPC with all contract fields', async () => {
        const { result } = renderHook(() => useContractVersioning(projectId), {
            wrapper: createWrapper()
        });

        const contractData = {
            project_id: projectId,
            client_id: 'client-123',
            contract_type: 'reserva',
            client_full_name: 'Juan Pérez',
            client_dni: '12345678A',
            client_email: 'juan@test.com',
            client_phone: '611222333',
            billing_entity_name: 'Nomade SL',
            billing_entity_nif: 'B12345678',
            billing_address: 'Calle Empresa 10',
            vehicle_model: 'Neo',
            vehicle_vin: 'VIN123',
            vehicle_plate: 'ABC1234',
            total_price: 55000,
            payment_conditions: 'Standard',
            iban: 'ES12345',
            delivery_months: 6,
            payment_first_percentage: 30,
            payment_first_amount: 16500,
            payment_second_percentage: 40,
            payment_second_amount: 22000,
            payment_third_percentage: 30,
            payment_third_amount: 16500,
        };

        await result.current.generateContract.mutateAsync({
            contractData: contractData as any,
            contractType: 'reserva',
        });

        expect(mockRpc).toHaveBeenCalledWith('generate_contract_version', expect.objectContaining({
            p_project_id: projectId,
            p_contract_type: 'reserva',
        }));
    });

    it('should save contract with standard type', async () => {
        const { result } = renderHook(() => useContractVersioning(projectId), {
            wrapper: createWrapper()
        });

        const contractData = {
            project_id: projectId,
            client_id: 'client-123',
            contract_type: 'standard',
            client_full_name: 'María García',
            client_dni: '98765432B',
            client_email: 'maria@test.com',
            client_phone: '699888777',
            billing_entity_name: 'María García',
            billing_entity_nif: '98765432B',
            billing_address: 'Calle Personal 5',
            vehicle_model: 'Neo XL',
            vehicle_vin: '',
            vehicle_plate: '',
            total_price: 70000,
            payment_conditions: '',
            iban: '',
        };

        await result.current.generateContract.mutateAsync({
            contractData: contractData as any,
            contractType: 'standard',
        });

        expect(mockRpc).toHaveBeenCalledWith('generate_contract_version', expect.objectContaining({
            p_contract_type: 'standard',
        }));
    });
});

describe('Contract Send Flow', () => {
    const projectId = 'proj-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should mark contract as sent by updating estado_visual', async () => {
        const { result } = renderHook(() => useContractVersioning(projectId), {
            wrapper: createWrapper()
        });

        await result.current.sendContract.mutateAsync('reserva');

        expect(mockFrom).toHaveBeenCalledWith('contracts');
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            estado_visual: 'sent',
            contract_status: 'sent',
        }));
    });
});

describe('Contract Auto-Save Flow', () => {
    const projectId = 'proj-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should auto-save contract updates with valid data', async () => {
        const { result } = renderHook(() => useContractVersioning(projectId), {
            wrapper: createWrapper()
        });

        const contractData = {
            project_id: projectId,
            client_id: 'client-123',
            contract_type: 'reserva',
            client_full_name: 'Updated Name',
            client_dni: '12345678A',
            client_email: 'updated@test.com',
            client_phone: '611222333',
            billing_entity_name: 'Updated',
            billing_entity_nif: 'NIF',
            billing_address: 'Addr',
            vehicle_model: 'Neo',
            vehicle_vin: '',
            vehicle_plate: '',
            total_price: 60000,
            payment_conditions: 'Updated conditions',
            iban: 'ES789',
        };

        await result.current.autoSave.mutateAsync({
            contractData: contractData as any,
            existingContractId: 'contract-1',
        });

        expect(mockFrom).toHaveBeenCalledWith('contracts');
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                total_price: 60000,
                payment_conditions: 'Updated conditions',
            })
        );
    });

    it('should not update if no valid fields provided', async () => {
        const { result } = renderHook(() => useContractVersioning(projectId), {
            wrapper: createWrapper()
        });

        const contractData = {
            project_id: projectId,
            client_id: 'client-123',
            contract_type: 'reserva',
            client_full_name: '',
            client_dni: '',
            client_email: '',
            client_phone: '',
            billing_entity_name: '',
            billing_entity_nif: '',
            billing_address: '',
            vehicle_model: '',
            vehicle_vin: '',
            vehicle_plate: '',
            total_price: -1,
            payment_conditions: '',
            iban: '',
        };

        await result.current.autoSave.mutateAsync({
            contractData: contractData as any,
            existingContractId: 'contract-1',
        });

        // Should not have called update since no valid fields
        expect(mockUpdate).not.toHaveBeenCalled();
    });
});
