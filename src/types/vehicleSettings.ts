export interface VehicleSettings {
  id: string;
  name: string;
  engine: string; // Motorización (ej. 120cv, 140cv, 180cv)
  transmission: string; // Tipo de cambio (Manual o Automática)
  color: string; // Color exterior
  dimensions: string; // Ej. L3H2, L2H2
  price: number;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleSettingsFormData {
  name: string;
  engine: string;
  transmission: string;
  color: string;
  dimensions: string;
  price: number;
  is_active?: boolean;
  order_index?: number;
}

export interface VehicleSettingsFilters {
  search?: string;
  engine?: string;
  transmission?: string;
  color?: string;
  dimensions?: string;
  is_active?: boolean;
}