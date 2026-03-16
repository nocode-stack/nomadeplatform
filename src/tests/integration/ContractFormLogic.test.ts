import { describe, it, expect } from 'vitest';

/**
 * Tests for the contract form business logic (Phase 3).
 * Validates simplified field requirements and auto-calculation logic.
 */

// ===== Progress calculation logic =====
// Simulates the progress field requirements per contract type

function getRequiredFields(contractType: string, billingType: 'company' | 'personal'): string[] {
  let allFields: string[] = [];

  if (billingType === 'company') {
    allFields = [
      'client_full_name', 'client_surname', 'client_email', 'client_phone',
      'client_country', 'client_autonomous_community', 'client_city', 'client_address_street', 'client_address_number',
      'billing_entity_name', 'billing_entity_nif',
      'billing_country', 'billing_autonomous_community', 'billing_city', 'billing_address_street', 'billing_office_unit',
      'iban',
    ];
    if (contractType === 'compraventa_final') {
      allFields.push('vehicle_model', 'vehicle_engine');
    }
  } else {
    allFields = [
      'client_full_name', 'client_surname', 'client_dni', 'client_email', 'client_phone',
      'client_country', 'client_autonomous_community', 'client_city', 'client_address_street', 'client_address_number',
      'iban',
    ];
    if (contractType === 'compraventa_final') {
      allFields.push('vehicle_model', 'vehicle_engine');
    }
  }

  // VIN/plate only for compraventa_final
  if (contractType === 'compraventa_final') {
    allFields.push('vehicle_vin', 'vehicle_plate');
  }

  // Type-specific fields
  if (contractType === 'reserva') {
    allFields.push('payment_reserve');
  } else if (contractType === 'encargo') {
    allFields.push('total_price', 'payment_first_amount');
  } else if (contractType === 'compraventa_final') {
    allFields.push('total_price', 'payment_last_manual');
  }

  return allFields;
}

// ===== Pending amount calculation (compraventa_final) =====

function calculatePendingAmount(
  totalPrice: number,
  reserva: number,
  pagoEncargo: number,
  ultimoPago: number
): number {
  return totalPrice - reserva - pagoEncargo - ultimoPago;
}

// ===== Validation logic =====

function validateContractFields(contractType: string, formData: Record<string, any>): string[] {
  const missing: string[] = [];

  if (!formData.client_full_name?.trim()) missing.push('client_full_name');
  if (!formData.client_email?.trim()) missing.push('client_email');
  if (!formData.billing_address?.trim()) missing.push('billing_address');

  // Vehicle model only for compraventa_final
  if (contractType === 'compraventa_final' && !formData.vehicle_model?.trim()) missing.push('vehicle_model');

  if (contractType === 'reserva' && (!formData.payment_reserve || formData.payment_reserve <= 0)) {
    missing.push('payment_reserve');
  }

  if (contractType === 'encargo') {
    if (!formData.total_price || formData.total_price <= 0) missing.push('total_price');
    if (!formData.payment_first_amount || formData.payment_first_amount <= 0) missing.push('payment_first_amount');
  }

  if (contractType === 'compraventa_final') {
    if (!formData.total_price || formData.total_price <= 0) missing.push('total_price');
    if (!formData.payment_last_manual || formData.payment_last_manual <= 0) missing.push('payment_last_manual');
  }

  return missing;
}

// ===== TESTS =====

describe('Reserva Form — Simplified Fields', () => {
  it('should NOT include vehicle fields for reserva (personal)', () => {
    const fields = getRequiredFields('reserva', 'personal');
    expect(fields).not.toContain('vehicle_model');
    expect(fields).not.toContain('vehicle_engine');
    expect(fields).not.toContain('vehicle_vin');
    expect(fields).not.toContain('vehicle_plate');
  });

  it('should NOT include vehicle fields for reserva (company)', () => {
    const fields = getRequiredFields('reserva', 'company');
    expect(fields).not.toContain('vehicle_model');
    expect(fields).not.toContain('vehicle_engine');
  });

  it('should include payment_reserve for reserva', () => {
    const fields = getRequiredFields('reserva', 'personal');
    expect(fields).toContain('payment_reserve');
  });

  it('should NOT include total_price for reserva', () => {
    const fields = getRequiredFields('reserva', 'personal');
    expect(fields).not.toContain('total_price');
  });

  it('should not require vehicle_model in validation', () => {
    const missing = validateContractFields('reserva', {
      client_full_name: 'Test',
      client_email: 'test@test.com',
      billing_address: 'Address',
      payment_reserve: 3000,
    });
    expect(missing).not.toContain('vehicle_model');
    expect(missing).toHaveLength(0);
  });
});

describe('Encargo Form — Simplified Payments', () => {
  it('should NOT include vehicle fields', () => {
    const fields = getRequiredFields('encargo', 'personal');
    expect(fields).not.toContain('vehicle_model');
    expect(fields).not.toContain('vehicle_engine');
    expect(fields).not.toContain('vehicle_vin');
    expect(fields).not.toContain('vehicle_plate');
  });

  it('should require total_price and payment_first_amount (pago de encargo)', () => {
    const fields = getRequiredFields('encargo', 'personal');
    expect(fields).toContain('total_price');
    expect(fields).toContain('payment_first_amount');
  });

  it('should NOT require delivery_months or payment_second/third fields', () => {
    const fields = getRequiredFields('encargo', 'personal');
    expect(fields).not.toContain('delivery_months');
    expect(fields).not.toContain('payment_second_percentage');
    expect(fields).not.toContain('payment_second_amount');
    expect(fields).not.toContain('payment_third_percentage');
    expect(fields).not.toContain('payment_third_amount');
    expect(fields).not.toContain('payment_first_percentage');
  });

  it('should validate payment_first_amount is required', () => {
    const missing = validateContractFields('encargo', {
      client_full_name: 'Test',
      client_email: 'test@test.com',
      billing_address: 'Addr',
      total_price: 55000,
      // payment_first_amount missing
    });
    expect(missing).toContain('payment_first_amount');
  });
});

describe('Compraventa Final — Auto-Calculations', () => {
  it('should include vehicle fields', () => {
    const fields = getRequiredFields('compraventa_final', 'personal');
    expect(fields).toContain('vehicle_model');
    expect(fields).toContain('vehicle_vin');
    expect(fields).toContain('vehicle_plate');
  });

  it('should require total_price and payment_last_manual', () => {
    const fields = getRequiredFields('compraventa_final', 'personal');
    expect(fields).toContain('total_price');
    expect(fields).toContain('payment_last_manual');
  });

  it('should calculate pending = totalPrice - reserva - encargo - ultimoPago', () => {
    const pending = calculatePendingAmount(55000, 3000, 15000, 37000);
    expect(pending).toBe(0);
  });

  it('should show negative pending when overpaid', () => {
    const pending = calculatePendingAmount(55000, 3000, 15000, 40000);
    expect(pending).toBe(-3000);
  });

  it('should show positive pending when underpaid', () => {
    const pending = calculatePendingAmount(55000, 3000, 15000, 30000);
    expect(pending).toBe(7000);
  });

  it('should handle missing reserva and encargo (no prior contracts)', () => {
    const pending = calculatePendingAmount(55000, 0, 0, 55000);
    expect(pending).toBe(0);
  });

  it('should validate payment_last_manual is required', () => {
    const missing = validateContractFields('compraventa_final', {
      client_full_name: 'Test',
      client_email: 'test@test.com',
      billing_address: 'Addr',
      vehicle_model: 'Neo',
      total_price: 55000,
      // payment_last_manual missing
    });
    expect(missing).toContain('payment_last_manual');
    expect(missing).not.toContain('vehicle_model');
  });
});
