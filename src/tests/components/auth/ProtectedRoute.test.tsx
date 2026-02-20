import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';
import { useDepartmentPermissions } from '../../../hooks/useDepartmentPermissions';
import React from 'react';

// Mock hooks
vi.mock('../../../hooks/useAuth', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../../hooks/useDepartmentPermissions', () => ({
    useDepartmentPermissions: vi.fn()
}));

describe('ProtectedRoute Component', () => {
    it('should redirect to login when not authenticated', () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            user: null,
            isLoading: false
        });
        (useDepartmentPermissions as any).mockReturnValue({
            data: null,
            isLoading: false
        });

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <div>Dashboard Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should show content when authenticated', () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: true,
            user: { id: '1', email: 'test@nomade-nation.com', department: 'Ventas' },
            isLoading: false
        });
        (useDepartmentPermissions as any).mockReturnValue({
            data: { routes: ['/dashboard'], department: { name: 'Ventas' } },
            isLoading: false
        });

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <div>Dashboard Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should show loading state', () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            user: null,
            isLoading: true
        });
        (useDepartmentPermissions as any).mockReturnValue({
            data: null,
            isLoading: false
        });

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <ProtectedRoute>
                    <div>Dashboard Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('should handle session expiration (authenticated but no user)', () => {
        // En Supabase, si el token caduca o la sesión es inválida, useAuth debería devolver isAuthenticated: false
        (useAuth as any).mockReturnValue({
            isAuthenticated: false, // Session expired
            user: null,
            isLoading: false
        });

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <div>Dashboard Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
});
