import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreateNewVehicle, useUpdateNewVehicle, useDeleteNewVehicle, useAssignNewVehicleToProject } from '../../hooks/useNewVehicles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Use vi.hoisted to avoid hoisting issues
const { mockInsert, mockUpdate, mockDelete, mockRpc } = vi.hoisted(() => ({
    mockInsert: vi.fn(),
    mockUpdate: vi.fn(),
    mockDelete: vi.fn(),
    mockRpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
}));

vi.mock('../../integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => {
            const chain: any = {
                select: vi.fn(() => chain),
                insert: (...args: any[]) => {
                    mockInsert(...args);
                    return {
                        select: vi.fn(() => ({
                            single: vi.fn(() => Promise.resolve({
                                data: { id: 'veh-new', brand: 'Ford', model: 'Transit', projects: null, estado_pago: 'pendiente' },
                                error: null
                            }))
                        }))
                    };
                },
                update: (...args: any[]) => {
                    mockUpdate(...args);
                    return {
                        eq: vi.fn(() => ({
                            select: vi.fn(() => ({
                                single: vi.fn(() => Promise.resolve({
                                    data: { id: 'veh-1', brand: 'Ford', model: 'Transit Updated', projects: null, estado_pago: 'pendiente' },
                                    error: null
                                }))
                            })),
                            then: (cb: any) => Promise.resolve({ data: null, error: null }).then(cb),
                        }))
                    };
                },
                delete: (...args: any[]) => {
                    mockDelete(...args);
                    return {
                        eq: vi.fn(() => Promise.resolve({ error: null }))
                    };
                },
                eq: vi.fn(() => chain),
                order: vi.fn(() => chain),
                then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb),
            };
            return chain;
        }),
        rpc: mockRpc,
    }
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

vi.mock('../../utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        vehicle: {
            assign: vi.fn(),
        },
    }
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useNewVehicles hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useCreateNewVehicle', () => {
        it('should insert a new vehicle with vehicle_code', async () => {
            const { result } = renderHook(() => useCreateNewVehicle(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                brand: 'Ford',
                model_name: 'Transit',
                year: 2024,
                vin: '1HGBH41JXMN109186',
                license_plate: '1234 ABC',
                status: 'available',
            } as any);

            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    brand: 'Ford',
                    vin: '1HGBH41JXMN109186',
                    vehicle_code: 'TEMP_CODE',
                })
            );
        });
    });

    describe('useUpdateNewVehicle', () => {
        it('should update vehicle data', async () => {
            const { result } = renderHook(() => useUpdateNewVehicle(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                id: 'veh-1',
                data: { license_plate: '5678 DEF', status: 'in_production' },
            });

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    license_plate: '5678 DEF',
                    status: 'in_production',
                })
            );
        });

        it('should convert empty fecha_pago to null', async () => {
            const { result } = renderHook(() => useUpdateNewVehicle(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                id: 'veh-1',
                data: { fecha_pago: '' },
            });

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ fecha_pago: null })
            );
        });
    });

    describe('useDeleteNewVehicle', () => {
        it('should delete a vehicle by ID', async () => {
            const { result } = renderHook(() => useDeleteNewVehicle(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync('veh-1');

            expect(mockDelete).toHaveBeenCalled();
        });
    });

    describe('useAssignNewVehicleToProject', () => {
        it('should call RPC to assign a vehicle to a project', async () => {
            const { result } = renderHook(() => useAssignNewVehicleToProject(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                vehicleId: 'veh-1',
                projectId: 'proj-1',
            });

            expect(mockRpc).toHaveBeenCalledWith('assign_vehicle_to_project_atomic', {
                p_vehicle_id: 'veh-1',
                p_project_id: 'proj-1',
            });
        });

        it('should call RPC with null to unassign a vehicle', async () => {
            const { result } = renderHook(() => useAssignNewVehicleToProject(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                vehicleId: 'veh-1',
                projectId: undefined,
            });

            expect(mockRpc).toHaveBeenCalledWith('assign_vehicle_to_project_atomic', {
                p_vehicle_id: 'veh-1',
                p_project_id: null,
            });
        });
    });
});
