import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContractVersioning } from '../../hooks/useContractVersioning';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Reusable mock objects
const mockRpc = vi.fn(() => Promise.resolve({ data: 'new-contract-id', error: null }));
const mockSingle = vi.fn(() => Promise.resolve({ data: { id: 'contract-123' }, error: null }));
const mockUpdate = vi.fn(() => ({
    eq: vi.fn(() => ({
        select: vi.fn(() => ({
            single: mockSingle
        })),
        then: (cb: any) => Promise.resolve({ error: null }).then(cb)
    }))
}));

const mockFrom = vi.fn((_table: string) => {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        single: vi.fn(() => Promise.resolve({ data: { budgets: [] }, error: null })),
        update: mockUpdate,
        then: (cb: any) => Promise.resolve({ data: { id: 'contract-123' }, error: null }).then(cb)
    };
    return chain;
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn((table: string) => mockFrom(table)),
        rpc: vi.fn((fnName: string, params: any) => mockRpc(fnName, params))
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

describe('useContractVersioning hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call generate_contract_version RPC with correct parameters', async () => {
        const projectId = 'proj-123';
        const { result } = renderHook(() => useContractVersioning(projectId), {
            wrapper: createWrapper()
        });

        const contractData = { project_id: projectId, client_id: 'client-123', client_full_name: 'Juan Pérez' };
        await result.current.generateContract.mutateAsync({
            contractData: contractData as any,
            contractType: 'standard'
        });

        expect(mockRpc).toHaveBeenCalledWith('generate_contract_version', expect.objectContaining({
            p_project_id: projectId,
            p_contract_type: 'standard'
        }));
    });

    it('should handle sendContract correctly', async () => {
        const projectId = 'proj-123';
        const { result } = renderHook(() => useContractVersioning(projectId), {
            wrapper: createWrapper()
        });

        await result.current.sendContract.mutateAsync('standard');

        expect(mockFrom).toHaveBeenCalledWith('NEW_Contracts');
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            estado_visual: 'sent'
        }));
    });
});
