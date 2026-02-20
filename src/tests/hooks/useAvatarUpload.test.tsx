import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { supabase } from '@/integrations/supabase/client';

// Mocks de Supabase Storage
const mockUpload = vi.fn(() => Promise.resolve({ data: { path: 'path/to/avatar.jpg' }, error: null }));
const mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } }));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl
            }))
        }
    }
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

describe('hook useAvatarUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debería subir un archivo y devolver la URL pública', async () => {
        const { result } = renderHook(() => useAvatarUpload());
        const file = new File([''], 'test.png', { type: 'image/png' });
        const userId = 'user-123';

        let url: string | null = null;
        await act(async () => {
            url = await result.current.uploadAvatar(file, userId);
        });

        expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
        expect(mockUpload).toHaveBeenCalledWith(
            expect.stringContaining(userId),
            file,
            expect.any(Object)
        );
        expect(url).toBe('https://example.com/avatar.jpg');
    });

    it('debería manejar errores de subida', async () => {
        mockUpload.mockResolvedValueOnce({ data: null, error: { message: 'Error de subida' } });

        const { result } = renderHook(() => useAvatarUpload());
        const file = new File([''], 'test.png', { type: 'image/png' });
        const userId = 'user-123';

        let url: string | null = null;
        await act(async () => {
            url = await result.current.uploadAvatar(file, userId);
        });

        expect(url).toBeNull();
    });

    it('debería cambiar el estado isUploading durante la subida', async () => {
        let resolveUpload: any;
        mockUpload.mockImplementationOnce(() => new Promise((resolve) => {
            resolveUpload = resolve;
        }));

        const { result } = renderHook(() => useAvatarUpload());
        const file = new File([''], 'test.png', { type: 'image/png' });

        let uploadPromise: Promise<string | null>;
        act(() => {
            uploadPromise = result.current.uploadAvatar(file, 'user-123');
        });

        expect(result.current.isUploading).toBe(true);

        await act(async () => {
            resolveUpload({ data: { path: 'ok' }, error: null });
            await uploadPromise;
        });

        expect(result.current.isUploading).toBe(false);
    });
});
