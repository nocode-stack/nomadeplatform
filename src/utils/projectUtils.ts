
import { DatabaseProject, UnifiedProject, ProjectStatus, ProjectPriority } from '../types/database';

// Now that status and progress come from database, these functions are simplified
export const calculateProjectStatus = (project: UnifiedProject): ProjectStatus => {
  // Return the status from database or default to creacion_cliente
  return project.status || 'creacion_cliente';
};

export const calculateProjectProgress = (project: UnifiedProject): number => {
  // Return the progress from database or default to 0
  return project.progress || 0;
};

export const calculateProjectPriority = (project: UnifiedProject): ProjectPriority => {
  // For now return medium as default (could be enhanced later)
  return project.priority || 'medium';
};

// Updated phase groups to match the cleaned database structure
export const PROJECT_PHASE_GROUPS = [
  { id: 'creacion_cliente', title: 'Creación de cliente' },
  { id: 'pre_production', title: 'Pre-producción' },
  { id: 'production', title: 'Producción' },
  { id: 'reworks', title: 'Reworks' },
  { id: 'pre_delivery', title: 'Pre-entrega' },
  { id: 'delivered', title: 'Entregado' },
  { id: 'repair', title: 'Reparación' }
];

// Get status display text - Updated to include repair
export const getStatusText = (status: ProjectStatus): string => {
  const statusMap: Record<ProjectStatus, string> = {
    'creacion_cliente': 'Creación de cliente',
    'pre_production': 'Pre-producción',
    'production': 'Producción',
    'reworks': 'Reworks',
    'pre_delivery': 'Pre-entrega',
    'delivered': 'Entregado',
    'repair': 'Reparación'
  };
  return statusMap[status] || status;
};

// Get status color class - Updated to include repair
export const getStatusColor = (status: ProjectStatus): string => {
  const colorMap: Record<ProjectStatus, string> = {
    'creacion_cliente': 'bg-slate-500',
    'pre_production': 'bg-blue-500',
    'production': 'bg-orange-500',
    'reworks': 'bg-amber-500',
    'pre_delivery': 'bg-purple-500',
    'delivered': 'bg-green-500',
    'repair': 'bg-red-500'
  };
  return colorMap[status] || 'bg-gray-500';
};

// Get priority display text
export const getPriorityText = (priority: ProjectPriority): string => {
  const priorityMap: Record<ProjectPriority, string> = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'urgent': 'Urgente'
  };
  return priorityMap[priority] || priority;
};

// Get priority color class
export const getPriorityColor = (priority: ProjectPriority): string => {
  const colorMap: Record<ProjectPriority, string> = {
    'low': 'bg-green-500',
    'medium': 'bg-yellow-500',
    'high': 'bg-orange-500',
    'urgent': 'bg-red-500'
  };
  return colorMap[priority] || 'bg-gray-500';
};

// Format date helper
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-ES');
  } catch {
    return '-';
  }
};

// Simplified helper to enhance project with computed properties
export const enhanceProjectWithComputedProps = (project: any): UnifiedProject => {
  const enhanced = project as UnifiedProject;
  // Status and progress now come from database, just set priority
  enhanced.status = enhanced.status || 'creacion_cliente';
  enhanced.progress = enhanced.progress || 0;
  enhanced.priority = enhanced.priority || calculateProjectPriority(enhanced);
  enhanced.manual_status_control = enhanced.manual_status_control || false;
  return enhanced;
};
