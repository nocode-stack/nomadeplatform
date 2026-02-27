import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreateNewIncident, useDeleteNewIncident } from '../../hooks/useNewIncidents';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((_table: string) => {
            const chain: any = {
                select: vi.fn(() => chain),
                insert: (...args: any[]) => {
                    mockInsert(...args);
                    return {
                        select: vi.fn(() => ({
                            single: vi.fn(() => Promise.resolve({
                                data: { id: 'inc-new', project_id: 'proj-1', description: 'Test', category: 'carrocería' },
                                error: null
                            }))
                        })),
                        then: (cb: any) => Promise.resolve({ error: null }).then(cb),
                    };
                },
                delete: (...args: any[]) => {
                    mockDelete(...args);
                    return {
                        eq: vi.fn(() => Promise.resolve({ error: null }))
                    };
                },
                eq: vi.fn((...eqArgs: any[]) => chain),
                order: vi.fn(() => chain),
                single: vi.fn(() => Promise.resolve({ data: { id: 'status-default' }, error: null })),
                then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb),
            };
            return chain;
        }),
        functions: {
            invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
        },
    }
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

vi.mock('@/utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        incident: {
            create: vi.fn(),
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

describe('useNewIncidents hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useCreateNewIncident', () => {
        it('should create an incident with required fields and items', async () => {
            const { result } = renderHook(() => useCreateNewIncident(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({
                project_id: 'proj-1',
                incident_date: '2024-06-01',
                description: 'Daño en puerta lateral',
                workshop: 'Taller Madrid',
                items: [
                    { description: 'Rayón puerta', category: 'carrocería', priority: 'high' },
                ],
            });

            expect(supabase.from).toHaveBeenCalledWith('incident_status');
            expect(supabase.from).toHaveBeenCalledWith('incidents');
            expect(mockInsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    project_id: 'proj-1',
                    description: 'Daño en puerta lateral',
                    workshop: 'Taller Madrid',
                })
            );
        });

        it('should throw error when items are missing', async () => {
            const { result } = renderHook(() => useCreateNewIncident(), {
                wrapper: createWrapper()
            });

            await expect(
                result.current.mutateAsync({
                    project_id: 'proj-1',
                    incident_date: '2024-06-01',
                    description: 'Sin items',
                    workshop: 'Taller',
                    items: [],
                })
            ).rejects.toThrow('Debe agregar al menos un concepto');
        });

        it('should throw error when project_id is missing', async () => {
            const { result } = renderHook(() => useCreateNewIncident(), {
                wrapper: createWrapper()
            });

            await expect(
                result.current.mutateAsync({
                    project_id: '',
                    incident_date: '2024-06-01',
                    description: 'Test',
                    workshop: 'Taller',
                    items: [{ description: 'Item', category: 'cat', priority: 'low' }],
                })
            ).rejects.toThrow('El ID del proyecto es requerido');
        });

        it('should throw error when description is empty', async () => {
            const { result } = renderHook(() => useCreateNewIncident(), {
                wrapper: createWrapper()
            });

            await expect(
                result.current.mutateAsync({
                    project_id: 'proj-1',
                    incident_date: '2024-06-01',
                    description: '',
                    workshop: 'Taller',
                    items: [{ description: 'Item', category: 'cat', priority: 'low' }],
                })
            ).rejects.toThrow('La descripción es requerida');
        });
    });

    describe('useDeleteNewIncident', () => {
        it('should delete incident items first, then the incident', async () => {
            const { result } = renderHook(() => useDeleteNewIncident(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync('inc-1');

            expect(supabase.from).toHaveBeenCalledWith('incident_items');
            expect(supabase.from).toHaveBeenCalledWith('incidents');
            expect(mockDelete).toHaveBeenCalled();
        });
    });
});
