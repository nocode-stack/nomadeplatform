/**
 * Typed interfaces for project-related forms and data.
 * Replaces `any` usage across hooks and components.
 */

export interface ProjectFormData {
    // Client info
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientDni?: string;
    clientAddress?: string;
    clientBirthdate?: string;
    clientBirthDate?: string;
    clientType?: string;

    // Project info
    projectCode?: string;
    status?: string;
    priority?: string;
    notes?: string;
    comercial?: string;

    // Vehicle / Budget specs
    vehicleModel?: string;
    motorization?: string;
    electricalSystem?: string;
    extraPacks?: string;
    exteriorColor?: string;
    furnitureColor?: string;
    discount?: string | number;
    reservationAmount?: number;
    budgetNotes?: string;
    projectNotes?: string;
    items?: BudgetItemInput[];
    forceNewBudget?: boolean;

    // Billing info — personal
    billingType?: 'personal' | 'company' | 'other_person';
    billingName?: string;
    billingEmail?: string;
    billingPhone?: string;
    billingAddress?: string;
    billingDni?: string;
    clientBillingName?: string;
    clientBillingEmail?: string;
    clientBillingPhone?: string;
    clientBillingAddress?: string;

    // Billing info — company
    clientBillingCompanyName?: string;
    clientBillingCompanyEmail?: string;
    clientBillingCompanyPhone?: string;
    clientBillingCompanyAddress?: string;
    clientBillingCompanyCif?: string;

    // Billing info — other person
    otherPersonName?: string;
    otherPersonEmail?: string;
    otherPersonPhone?: string;
    otherPersonAddress?: string;
    otherPersonDni?: string;

    // Legacy compat
    selectedModelId?: string;
    selectedEngineId?: string;
    selectedExteriorColorId?: string;
    selectedInteriorColorId?: string;
    specifications?: string;
    comments?: string;
    deliveryMonths?: number;
    budgetTotal?: number;
    budgetDiscount?: number;
    budgetReserve?: number;
    budgetIva?: number;
    vehicleModel_legacy?: string;
    vehicleEngine?: string;
    vehiclePlate?: string;
    vehicleVin?: string;
    vehicleExteriorColor?: string;
    vehicleInteriorColor?: string;
}

export interface BudgetFormData {
    modelId?: string;
    engineId?: string;
    exteriorColorId?: string;
    interiorColorId?: string;
    basePrice?: number;
    discount?: number;
    reserve?: number;
    total?: number;
    iva?: number;
    specifications?: string;
    comments?: string;
    additionalItems?: AdditionalItemData[];
}

export interface BudgetItemInput {
    name: string;
    price: number;
    quantity: number;
    is_custom?: boolean;
}

export interface AdditionalItemData {
    id?: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    category?: string;
}

export interface PhaseUpdateData {
    status: string;
    start_date?: string;
    end_date?: string;
}

export interface ClientFormData {
    name: string;
    email: string;
    phone: string;
    dni: string;
    address: string;
    birthdate?: string;
    clientType?: string;
}

export interface BillingFormData {
    name: string;
    nif: string;
    billingAddress: string;
    email?: string;
    phone?: string;
    paymentMethod?: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    dni?: string;
    address?: string;
    status: string;
    source?: string;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
    assignedTo?: string;
    projectId?: string;
    clientType?: string;
    birthdate?: string;
}

export interface ProjectFilters {
    status?: string;
    priority?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}
