import { useMemo } from 'react';
import { UnifiedProject } from '../types/database';

export interface ProjectTab {
  id: string;
  label: string;
  allowedForProspects: boolean;
  requiresClient: boolean;
}

export const useProjectTabsAccess = (project: UnifiedProject | null) => {
  const allTabs: ProjectTab[] = [
    {
      id: 'resumen',
      label: 'Resumen',
      allowedForProspects: true,
      requiresClient: false
    },
    {
      id: 'informacion',
      label: 'Información',
      allowedForProspects: true,
      requiresClient: false
    },
    {
      id: 'presupuestos',
      label: 'Presupuestos',
      allowedForProspects: true,
      requiresClient: false
    },
    {
      id: 'comentarios',
      label: 'Comentarios',
      allowedForProspects: true,
      requiresClient: false
    },
    {
      id: 'incidencias',
      label: 'Incidencias',
      allowedForProspects: false,
      requiresClient: true
    },
    {
      id: 'contratos',
      label: 'Contratos',
      allowedForProspects: false,
      requiresClient: true
    },
    {
      id: 'entrega',
      label: 'Entrega',
      allowedForProspects: false,
      requiresClient: true
    }
  ];

  const isProspect = project?.new_clients?.client_status === 'prospect';
  const isClient = project?.new_clients?.client_status === 'client';

  const allowedTabs = useMemo(() => {
    if (isProspect) {
      return allTabs.filter(tab => tab.allowedForProspects);
    }
    return allTabs; // Clientes pueden ver todas las pestañas
  }, [isProspect]);

  const canAccessTab = (tabId: string): boolean => {
    const tab = allTabs.find(t => t.id === tabId);
    if (!tab) return false;

    if (isProspect) {
      return tab.allowedForProspects;
    }
    return true; // Clientes pueden acceder a todas
  };

  const getRestrictedMessage = (tabId: string): string => {
    const restrictedMessages: Record<string, string> = {
      incidencias: 'Las incidencias solo están disponibles para clientes. Convierte este prospect a cliente para habilitar esta funcionalidad.',
      contratos: 'Los contratos solo están disponibles para clientes. Convierte este prospect a cliente para habilitar esta funcionalidad.',
      entrega: 'La gestión de entrega solo está disponible para clientes. Convierte este prospect a cliente para habilitar esta funcionalidad.'
    };
    
    return restrictedMessages[tabId] || 'Esta funcionalidad solo está disponible para clientes.';
  };

  return {
    allTabs,
    allowedTabs,
    canAccessTab,
    getRestrictedMessage,
    isProspect,
    isClient
  };
};