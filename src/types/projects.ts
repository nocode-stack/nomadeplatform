
export interface ProjectMember {
  id: string;
  name: string;
  role: 'commercial' | 'production_manager' | 'operator' | 'quality_inspector' | 'delivery';
  email: string;
  avatar?: string;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  responsible: ProjectMember;
  dependencies?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProjectAlert {
  id: string;
  type: 'delay' | 'quality_issue' | 'resource_conflict' | 'payment_pending' | 'delivery_scheduled';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  createdAt: string;
  dismissedAt?: string;
  actionRequired: boolean;
}

export interface ProjectResource {
  id: string;
  type: 'material' | 'equipment' | 'workspace';
  name: string;
  quantity: number;
  unit: string;
  allocated: number;
  status: 'available' | 'reserved' | 'in_use' | 'maintenance';
}

export interface Project {
  id: string;
  name: string;
  code: string;
  model: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  commercial: ProjectMember;
  status: 'draft' | 'confirmed' | 'pre_production' | 'in_production' | 'quality_control' | 'packaging' | 'delivery' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  
  // Fechas
  createdAt: string;
  updatedAt: string;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  deliveryDate: string;
  
  // Especificaciones
  specifications: {
    power: string;
    interiorColor: string;
    exteriorColor: string;
    year: string;
    serialNumber: string;
    customFeatures?: string[];
  };
  
  // Financiero
  pricing: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    currency: string;
  };
  
  // Equipo y recursos
  team: ProjectMember[];
  resources: ProjectResource[];
  milestones: ProjectMilestone[];
  alerts: ProjectAlert[];
  
  // Notas y documentos
  notes?: string;
  documents: string[];
  images: string[];
  
  // Métricas
  metrics: {
    plannedDuration: number; // días
    actualDuration?: number;
    budgetVariance: number; // porcentaje
    qualityScore?: number;
  };
}

export interface ProjectFilter {
  search?: string;
  type?: ('prospect' | 'client')[];
  status?: Project['status'][];
  priority?: Project['priority'][];
  commercial?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  overdue?: boolean;
  hasAlerts?: boolean;
}

export interface ProjectStats {
  total: number;
  byStatus: Record<Project['status'], number>;
  byPriority: Record<Project['priority'], number>;
  overdue: number;
  withAlerts: number;
  avgProgress: number;
  avgDuration: number;
}
