
import React from 'react';
import Layout from '../components/layout/Layout';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage = ({ title, subtitle }: PlaceholderPageProps) => {
  return (
    <Layout title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Construction className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h2>
        <p className="text-gray-600 text-center max-w-md">
          Esta sección está siendo desarrollada como parte de la plataforma integral de Nomade Nation.
        </p>
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Próximamente incluirá:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Gestión completa del módulo {title}</li>
            <li>• Integración con el flujo de proyectos</li>
            <li>• Sistema de notificaciones</li>
            <li>• Reportes y analytics</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default PlaceholderPage;
