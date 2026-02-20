// Core database types that match Supabase schema
export interface DatabaseClient {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  dni?: string;
  birthdate?: string;
  client_code?: string;
  client_type?: string;
  client_status?: 'prospect' | 'client';
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseVehicle {
  id: string;
  numero_bastidor: string;
  matricula?: string;
  engine?: string;
  transmission_type?: string;
  exterior_color?: string;
  plazas?: string;
  dimensions?: string;
  proveedor?: string;
  location?: string;
  estado_pago?: string;
  fecha_pago?: string;
  vehicle_code: string;
  project_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseProductionSlot {
  id: string;
  production_code: string;
  start_date: string;
  end_date: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabasePhaseTemplate {
  id: string;
  phase_group: string;
  phase_name: string;
  phase_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProjectPhaseProgress {
  id: string;
  project_id: string;
  phase_template_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date?: string;
  end_date?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

// Project status type - ACTUALIZADO para cambiar 'prospect' por 'creacion_cliente'
export type ProjectStatus =
  | 'creacion_cliente'
  | 'pre_production'
  | 'production'
  | 'reworks'
  | 'pre_delivery'
  | 'delivered'
  | 'repair';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

// Unified project type - Complete interface
export interface UnifiedProject {
  id: string;
  name?: string;
  code: string; // Alias for project_code 
  project_code?: string;
  client_name?: string;
  model?: string;
  pack?: string;
  power?: string;
  interior_color?: string;
  exterior_color?: string;
  electric_system?: string;
  extra_packages?: string;
  furgon_specs?: string;
  extras?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  progress?: number;
  currentPhase?: string;
  manual_status_control?: boolean;
  client_id?: string;
  vehicle_id?: string;
  slot_id?: string;
  production_code_id?: string;
  comercial?: string;
  start_date?: string;
  delivery_date?: string;
  created_at: string;
  updated_at?: string;

  // Relationships - with backward compatibility
  new_clients?: DatabaseClient | null;
  clients?: DatabaseClient | null; // Backward compatibility
  vehicles?: DatabaseVehicle | null;
  production_slot?: DatabaseProductionSlot | null;
  project_codes?: {
    id: string;
    code: string;
    name: string;
    start_date?: string;
    end_date?: string;
    estimated_duration_days?: number;
    status: 'available' | 'assigned' | 'completed';
    category: string;
    notes?: string;
  } | null;
  project_phase_progress?: Array<{
    id: string;
    project_id: string;
    phase_template_id: string;
    is_completed: boolean;
    completed_at?: string;
    completed_by?: string;
    notes?: string;
    phase_templates: {
      id: string;
      phase_name: string;
      phase_group: string;
      description?: string;
      responsible_role?: string;
      order_index: number;
      estimated_days: number;
      is_required: boolean;
    };
  }>;
}

// Legacy compatibility interface - DEPRECATED - use UnifiedProject instead
export interface DatabaseProject extends UnifiedProject { }

// Additional utility types
export type ProjectCodeStatus = 'available' | 'assigned' | 'completed' | 'cancelled';
export type ProjectCodeCategory = 'vehiculo' | 'motocicleta' | 'custom' | 'general';

export interface ProjectCodeFilter {
  search?: string;
  status?: ProjectCodeStatus[];
  category?: ProjectCodeCategory[];
  dateRange?: {
    start: string;
    end: string;
  };
}
