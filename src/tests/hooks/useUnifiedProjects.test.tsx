import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUnifiedProjectsList } from '../../hooks/useUnifiedProjects';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase
const mockSupabaseData = {
    projects: [
        { id: 'proj-1', project_code: 'PR-001', client_id: 'cl-1', status: 'prospect', created_at: '2024-01-01', NEW_Clients: { id: 'cl-1', name: 'Juan', client_status: 'prospect', client_code: 'PC-001' } }
    ],
    phases: [
        { project_id: 'proj-1', id: 'ph-1', status: 'completed', NEW_Project_Phase_Template: { group: 'Diseño', phase_order: 1 } },
        { project_id: 'proj-1', id: 'ph-2', status: 'in_progress', NEW_Project_Phase_Template: { group: 'Producción', phase_order: 2 } }
    ],
    vehicle: { id: 'veh-1', vehicle_code: 'V-001', exterior_color: 'Blanco', project_id: 'proj-1' },
    budget: {
        project_id: 'proj-1',
        id: 'bug-1',
        is_primary: true,
        model_option: { name: 'Neo' },
    }
};

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((table) => {
            // Create a fully chainable builder where every method returns `this`
            // and terminal methods (then, maybeSingle, single) resolve with data
            const createBuilder = (resolveData: any) => {
                const builder: any = {};
                const chainMethods = ['select', 'eq', 'in', 'order', 'limit', 'neq', 'or', 'is'];
                chainMethods.forEach(method => {
                    builder[method] = vi.fn(() => builder);
                });
                // Terminal methods
                builder.maybeSingle = vi.fn(() => Promise.resolve({ data: resolveData, error: null }));
                builder.single = vi.fn(() => Promise.resolve({ data: resolveData, error: null }));
                // Make builder thenable (so `await builder` works)
                builder.then = (onFulfilled: any, onRejected?: any) => {
                    return Promise.resolve({ data: Array.isArray(resolveData) ? resolveData : [resolveData], error: null })
                        .then(onFulfilled, onRejected);
                };
                return builder;
            };

            if (table === 'NEW_Projects') {
                return createBuilder(mockSupabaseData.projects);
            } else if (table === 'NEW_Project_Phase_Progress') {
                return createBuilder(mockSupabaseData.phases);
            } else if (table === 'NEW_Vehicles') {
                return createBuilder(mockSupabaseData.vehicle);
            } else if (table === 'NEW_Budget') {
                return createBuilder(mockSupabaseData.budget);
            }

            return createBuilder([]);
        }),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn()
        })),
        removeChannel: vi.fn()
    }
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() })
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('hook useUnifiedProjects', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useUnifiedProjectsList', () => {
        it('should fetch a list of projects', async () => {
            const { result } = renderHook(() => useUnifiedProjectsList(), {
                wrapper: createWrapper()
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 });

            expect(result.current.data).toHaveLength(1);
            expect(result.current.data?.[0].client_name).toBe('Juan');
        });
    });
});
