import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the common JWT auth guard pattern used across all edge functions.
 * These verify the authentication enforcement logic that protects endpoints.
 */

// Simulates the auth guard pattern extracted from edge functions
function createAuthGuard(supabaseClient: any) {
    return async (authHeader: string | null): Promise<{ user: any | null; error: string | null; status: number }> => {
        if (!authHeader) {
            return { user: null, error: 'Missing authorization header', status: 401 };
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token || token === authHeader) {
            return { user: null, error: 'Invalid authorization format', status: 401 };
        }

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) {
            return { user: null, error: 'Invalid or expired token', status: 401 };
        }

        return { user, error: null, status: 200 };
    };
}

describe('Edge Function Auth Guard', () => {
    let mockSupabase: any;
    let authGuard: ReturnType<typeof createAuthGuard>;

    beforeEach(() => {
        mockSupabase = {
            auth: {
                getUser: vi.fn(),
            },
        };
        authGuard = createAuthGuard(mockSupabase);
    });

    it('should return 401 when no Authorization header is provided', async () => {
        const result = await authGuard(null);

        expect(result.status).toBe(401);
        expect(result.error).toBe('Missing authorization header');
        expect(result.user).toBeNull();
        expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has no Bearer prefix', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' },
        });

        const result = await authGuard('some-random-string');

        expect(result.status).toBe(401);
    });

    it('should return 401 when token is invalid/expired', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'JWT expired' },
        });

        const result = await authGuard('Bearer expired-token-123');

        expect(result.status).toBe(401);
        expect(result.error).toBe('Invalid or expired token');
        expect(result.user).toBeNull();
        expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('expired-token-123');
    });

    it('should return 401 when getUser returns null user without error', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        });

        const result = await authGuard('Bearer valid-format-but-no-user');

        expect(result.status).toBe(401);
        expect(result.user).toBeNull();
    });

    it('should return 200 with user when token is valid', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'admin@nomade-nation.com',
            user_metadata: { role: 'admin' },
        };
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });

        const result = await authGuard('Bearer valid-jwt-token');

        expect(result.status).toBe(200);
        expect(result.user).toEqual(mockUser);
        expect(result.error).toBeNull();
        expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-jwt-token');
    });

    it('should strip Bearer prefix correctly', async () => {
        const mockUser = { id: 'user-456' };
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });

        await authGuard('Bearer my.jwt.token');

        expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('my.jwt.token');
    });
});
