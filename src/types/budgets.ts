export interface BudgetConcept {
  id: string;
  category: 'base' | 'modelo' | 'color_interior' | 'opcionales' | 'sistema_electrico' | 'otros';
  subcategory?: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleOption {
  id: string;
  name: string;
  power: string;
  transmission: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  price_modifier: number;
  price_export?: number;
}

// Interface InteriorColorOption eliminada - tabla no existe

export interface BudgetPack {
  id: string;
  name: string;
  description?: string;
  price: number;
  price_export?: number;
  is_active: boolean;
  order_index?: number; // Make optional since table doesn't have this column
  created_at: string;
  updated_at: string;
  pack_components?: PackComponent[];
}

export interface PackComponent {
  id: string;
  pack_id: string;
  name: string;
  description?: string;
  price_reduction: number;
  is_removable: boolean;
  created_at: string;
}

export interface ElectricSystem {
  id: string;
  name: string;
  description: string;
  price: number;
  price_export?: number;
  discount_price?: number;
  required_packs?: string[];
  pack_pricing_rules?: any; // JSONB field for dynamic pricing rules
  is_standalone: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtraComponent {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  project_id: string;
  budget_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_dni?: string;
  date: string;
  notes?: string;
  subtotal: number;
  iva_rate: number;
  iva_amount: number;
  total: number;
  iemdt_amount?: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  pdf_url?: string;
  created_by?: string;
  vehicle_option_id?: string;
  general_discount_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  concept_id?: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  discount_percentage: number;
  line_total: number;
  order_index: number;
  pack_id?: string;
  is_custom?: boolean;
  removed_components?: any; // Changed from string[] to any to match Json type
  is_discount_item?: boolean;
  created_at: string;
}

export interface BudgetWithItems extends Budget {
  budget_items: BudgetItem[];
  vehicle_option?: VehicleOption;
}

// ===== INTERFACES PARA EL SISTEMA REORGANIZADO =====

export interface NewBudget {
  id: string;
  budget_code?: string | null;
  status: string;
  subtotal: number | null;
  total: number | null;
  discount_amount: number | null;
  iva_rate: number | null;
  base_price: number | null;
  pack_price: number | null;
  electric_system_price: number | null;
  color_modifier: number | null;
  client_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  budget_items?: NewBudgetItem[];
  // Configuración del vehículo
  engine_option_id?: string | null;
  model_option_id?: string | null;
  exterior_color_id?: string | null;
  interior_color_id?: string | null;
  pack_id?: string | null;
  electric_system_id?: string | null;
  reservation_amount?: number | null;
  discount_percentage?: number | null;
  is_active?: boolean | null;
  location?: string | null;
}

export interface JoinedNewBudget extends NewBudget {
  client?: {
    id: string;
    name: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    client_code?: string | null;
    [key: string]: any; // Allow additional fields from full client row
  } | null;
  engine_option?: { name: string } | null;
  model_option?: { name: string } | null;
  pack?: { name: string } | null;
  is_primary?: boolean | null;
}

export interface NewBudgetItem {
  id: string;
  budget_id?: string; // NULL para items catálogo, tiene valor para items en presupuesto específico
  concept_id?: string;
  pack_id?: string;
  discount_reason_id?: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  quantity: number;
  discount_percentage?: number;
  line_total: number;
  is_custom: boolean;
  is_discount: boolean;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface NewBudgetPack {
  id: string;
  name: string;
  description?: string;
  price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewBudgetDiscount {
  id: string;
  code: string;
  label: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewBudgetHistory {
  id: string;
  budget_id: string;
  changed_by?: string;
  change_type: string;
  change_description?: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

// Interface para el cálculo de totales
export interface BudgetCalculation {
  basePrice: number;
  packPrice: number;
  electricSystemPrice: number;
  colorModifier: number;
  itemsTotal: number;
  subtotal: number;
  discountAmount: number;
  ivaAmount: number;
  total: number;
  electricSystemDetails?: {
    originalPrice: number;
    finalPrice: number;
    discountAmount: number;
    isFree: boolean;
    discountReason: string | null;
  };
}
