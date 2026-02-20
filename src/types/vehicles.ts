export interface Vehicle {
  id: string;
  numero_bastidor: string;
  matricula?: string;
  color_exterior: string;
  motorizacion: '140cv manual' | '180cv automatica';
  plazas: 2 | 3;
  proveedor: string;
  project_id?: string;
  ubicacion: 'nomade' | 'concesionario' | 'taller' | 'cliente';
  estado_pago: 'pagada' | 'no_pagada' | 'pendiente';
  fecha_pago?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleFormData {
  numero_bastidor: string;
  matricula?: string;
  color_exterior: string;
  motorizacion: '140cv manual' | '180cv automatica';
  plazas: 2 | 3;
  proveedor: string;
  ubicacion: 'nomade' | 'concesionario' | 'taller' | 'cliente';
  estado_pago: 'pagada' | 'no_pagada' | 'pendiente';
  fecha_pago?: string;
  vehicle_option_id?: string; // Optional para backward compatibility
}

export interface VehicleFilters {
  search?: string;
  motorizacion?: string;
  plazas?: number;
  assigned?: 'assigned' | 'unassigned' | 'all';
  ubicacion?: string;
  estado_pago?: string;
}

// New vehicle types for NEW_Vehicles table with direct specifications
export interface NewVehicle {
  id: string;
  vehicle_code: string;
  numero_bastidor: string;
  matricula?: string;
  engine?: string;
  transmission_type?: string;
  exterior_color?: string;
  plazas?: string;
  dimensions?: string;
  proveedor?: string;
  location?: string;
  estado_pago: 'pagada' | 'no_pagada' | 'pendiente';
  fecha_pago?: string;
  project_id?: string;
  created_at: string;
  updated_at?: string;
  projects?: {
    id: string;
    name: string;
    code: string;
    clients?: {
      name: string;
    } | null;
  } | null;
}

export interface NewVehicleFormData {
  vehicle_code?: string; // Opcional - se generará automáticamente
  numero_bastidor: string;
  matricula?: string;
  engine?: string;
  transmission_type?: string;
  exterior_color?: string;
  plazas?: string;
  dimensions?: string;
  proveedor?: string;
  estado_pago?: 'pagada' | 'no_pagada' | 'pendiente';
  fecha_pago?: string;
  location?: string;
}

export interface NewVehicleFilters {
  search?: string;
  assigned?: 'assigned' | 'unassigned' | 'all';
  location?: string;
  estado_pago?: string;
  engine?: string;
  transmission_type?: string;
}