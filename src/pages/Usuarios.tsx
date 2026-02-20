import React from 'react';
import Layout from '@/components/layout/Layout';
import { UserInvitationManager } from '@/components/users/UserInvitationManager';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Usuarios = () => {
    return (
        <ProtectedRoute requiredDepartment="Dirección">
            <Layout
                title="Usuarios"
                subtitle="Lista de personal con acceso a la plataforma"
            >
                <div className="space-y-6">
                    <UserInvitationManager />
                </div>
            </Layout>
        </ProtectedRoute>
    );
};

export default Usuarios;
