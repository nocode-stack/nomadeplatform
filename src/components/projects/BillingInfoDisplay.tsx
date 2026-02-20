import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { UnifiedProject } from '../../types/database';

interface BillingInfoDisplayProps {
  project: UnifiedProject;
}

const BillingInfoDisplay: React.FC<BillingInfoDisplayProps> = ({ project }) => {
  // Cargar datos de facturación - usar el mismo query key que useBillingData
  const { data: billingData, isLoading } = useQuery({
    queryKey: ['billing-data', project?.new_clients?.id],
    queryFn: async () => {
      if (!project?.new_clients?.id) return null;

      const { data, error } = await supabase
        .from('NEW_Billing')
        .select('*')
        .eq('client_id', project.new_clients.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching billing data:', error);
        return null;
      }

      return data;
    },
    enabled: !!project?.new_clients?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando datos de facturación...</span>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          <strong>No hay información de facturación:</strong> Haz clic en "Editar Facturación" para añadir los datos de facturación para este proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Información:</strong> Estos datos se utilizarán para generar las facturas y contratos del proyecto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600">Tipo de facturación</span>
          <span className="font-medium text-gray-900">
            {billingData.type === 'company' ? 'Empresa' : 'Persona física'}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600">
            {billingData.type === 'company' ? 'Nombre de la empresa' : 'Nombre completo'}
          </span>
          <span className="font-medium text-gray-900">{billingData.name || '-'}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600">
            {billingData.type === 'company' ? 'CIF' : 'NIF/DNI'}
          </span>
          <span className="font-medium text-gray-900">{billingData.nif || '-'}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600">Email</span>
          <span className="font-medium text-gray-900">{billingData.email || '-'}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600">Teléfono</span>
          <span className="font-medium text-gray-900">{billingData.phone || '-'}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600">Dirección de facturación</span>
          <span className="font-medium text-gray-900">{billingData.billing_address || '-'}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
        <strong>Última actualización:</strong> {billingData.updated_at ? new Date(billingData.updated_at).toLocaleString('es-ES') : 'Nunca'}
      </div>
    </div>
  );
};

export default BillingInfoDisplay;