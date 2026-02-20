import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileDialog from '../../components/user/ProfileDialog';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useDepartmentPermissions } from '../../hooks/useDepartmentPermissions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock hooks
vi.mock('../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../hooks/useUserProfile', () => ({
    useUserProfile: vi.fn(),
    useUpdateProfile: () => ({
        mutateAsync: vi.fn(),
        isPending: false
    })
}));

vi.mock('../../hooks/useDepartmentPermissions', () => ({
    useDepartmentPermissions: vi.fn(),
}));

vi.mock('../../hooks/useAvatarUpload', () => ({
    useAvatarUpload: () => ({
        uploadAvatar: vi.fn(),
        isUploading: false
    })
}));

vi.mock('../../hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn()
    })
}));

// Mock Lucide icons to avoid rendering issues in tests
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual as any,
        LogOut: () => <div data-testid="logout-icon" />,
        Search: () => <div data-testid="search-icon" />,
        Bell: () => <div data-testid="bell-icon" />,
        User: () => <div data-testid="user-icon" />,
        Camera: () => <div data-testid="camera-icon" />,
        Lock: () => <div data-testid="lock-icon" />,
        Eye: () => <div data-testid="eye-icon" />,
        EyeOff: () => <div data-testid="eye-off-icon" />,
    };
});

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('Logout Functionality', () => {
    const mockLogout = vi.fn();
    const mockUser = { id: 'user-123', name: 'Test User', email: 'test@nomade-nation.com', role: 'admin' };
    const mockProfile = { name: 'Test User', email: 'test@nomade-nation.com', department: 'IT', avatar_url: null };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: mockUser,
            logout: mockLogout,
            updateUserProfile: vi.fn(),
            changePassword: vi.fn()
        });
        (useUserProfile as any).mockReturnValue({
            data: mockProfile,
            isLoading: false,
            refetch: vi.fn()
        });
        (useDepartmentPermissions as any).mockReturnValue({
            data: { department: { name: 'IT' } },
        });
    });

    describe('ProfileDialog Logout', () => {
        it('should call logout function when "Cerrar Sesión" button is clicked inside dialog', async () => {
            render(
                <ProfileDialog>
                    <button>Open Profile</button>
                </ProfileDialog>,
                { wrapper: createWrapper() }
            );

            // Open the dialog
            fireEvent.click(screen.getByText('Open Profile'));

            // Find the logout button in the dialog
            const logoutBtn = screen.getByText('Cerrar Sesión');
            expect(logoutBtn).toBeInTheDocument();

            fireEvent.click(logoutBtn);

            expect(mockLogout).toHaveBeenCalledTimes(1);
        });
    });
});
