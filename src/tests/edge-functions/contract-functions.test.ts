import { describe, it, expect } from 'vitest';

/**
 * Tests for contract-related edge functions.
 * Validates contract type mapping, payload structure, and buyer block generation.
 */

// Simulates the contract type mapping from trigger-contract-webhook
function mapContractType(contractType: string): string {
    const mapping: Record<string, string> = {
        'reserva': 'reserva',
        'compraventa_final': 'compraventa',
        'encargo': 'encargo',
    };
    return mapping[contractType] || contractType;
}

// Simulates the template ID selection from trigger-contract-webhook
function getTemplateId(contractType: string): number {
    if (contractType === 'reserva') return 206669;
    if (contractType === 'encargo') return 208468;
    return 206808; // compraventa_final default
}

// Simulates the comprador_bloque generation
function generateCompradorBloque(record: {
    client_full_name?: string;
    client_dni?: string;
    client_phone?: string;
    client_email?: string;
    billing_entity_name?: string;
    billing_address?: string;
    billing_entity_nif?: string;
}, clientAddress: string): string {
    const isCompany = record.billing_entity_name &&
        record.billing_entity_name.trim() !== '' &&
        record.billing_entity_name !== record.client_full_name;

    if (isCompany) {
        return `De otra parte, D./Dª. ${record.client_full_name || ''}, mayor de edad, provista de D.N.I número ${record.client_dni || ''}, y domicilio en ${clientAddress || ''}, en nombre y representación de la mercantil ${record.billing_entity_name || ''}, con domicilio en ${record.billing_address || ''}, con C.I.F. ${record.billing_entity_nif || ''}, teléfono: ${record.client_phone || ''}, e-mail: ${record.client_email || ''}. En adelante EL COMPRADOR.`;
    }
    return `De otra parte, D./Dª. ${record.client_full_name || ''}, mayor de edad, provista de D.N.I número ${record.client_dni || ''}, y domicilio en ${clientAddress || ''}, teléfono: ${record.client_phone || ''}, e-mail: ${record.client_email || ''}. En adelante EL COMPRADOR.`;
}

// Simulates the Spanish price formatting
function formatSpanishPrice(price: number): string {
    if (price === null || price === undefined) return '0,00';
    const rounded = Math.round(price * 100) / 100;
    return rounded.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Simulates the common fields builder
function buildCommonFields(record: any): Array<{ name: string; value: string }> {
    return [
        { name: 'comprador_bloque', value: generateCompradorBloque(record, record.client_address || '') },
        { name: 'fecha_envio', value: '13/03/26' },
        { name: 'client_name', value: record.client_full_name || 'Cliente' },
        { name: 'client_email', value: record.client_email || 'firma@nomade-nation.com' },
        { name: 'client_dni', value: record.client_dni || '' },
        { name: 'client_phone', value: record.client_phone || '' },
        { name: 'iban', value: record.iban || '' },
        { name: 'billing_entity_name', value: record.billing_entity_name || '' },
        { name: 'billing_address', value: record.billing_address || '' },
        { name: 'billing_entity_nif', value: record.billing_entity_nif || '' },
    ];
}

// Simulates the specific fields builder per contract type
function buildSpecificFields(contractType: string, record: any, reservaAmount: number, encargoAmount: number): Array<{ name: string; value: string }> {
    if (contractType === 'reserva') {
        return [
            { name: 'importe_reserva', value: formatSpanishPrice(record.payment_reserve || 0) },
        ];
    } else if (contractType === 'encargo') {
        return [
            { name: 'precio_total', value: formatSpanishPrice(record.total_price || 0) },
            { name: 'importe_reserva', value: formatSpanishPrice(record.payment_reserve || 0) },
            { name: 'pago_encargo', value: formatSpanishPrice(record.payment_first_amount || 0) },
        ];
    } else if (contractType === 'compraventa_final') {
        const lastManual = record.payment_last_manual || 0;
        const totalPrice = record.total_price || 0;
        const pendiente = totalPrice - reservaAmount - encargoAmount - lastManual;
        return [
            { name: 'precio_total', value: formatSpanishPrice(totalPrice) },
            { name: 'importe_reserva', value: formatSpanishPrice(reservaAmount) },
            { name: 'pago_encargo', value: formatSpanishPrice(encargoAmount) },
            { name: 'ultimo_pago', value: formatSpanishPrice(lastManual) },
            { name: 'pendiente', value: formatSpanishPrice(Math.max(0, pendiente)) },
            { name: 'modelo_nomade', value: record.vehicle_model || '' },
            { name: 'engine', value: record.vehicle_engine || '' },
            { name: 'vin_number', value: record.vehicle_vin || '' },
            { name: 'plate_number', value: record.vehicle_plate || '' },
        ];
    }
    return [];
}

// Simulates payload validation
function validateContractPayload(payload: { contractId?: string; htmlContent?: string }): string | null {
    if (!payload.contractId) return 'Missing contractId';
    if (!payload.htmlContent) return 'Missing htmlContent';
    return null;
}

function validateEmailPayload(payload: {
    contractId?: string;
    clientEmail?: string;
}): string | null {
    if (!payload.contractId) return 'Missing contractId';
    if (!payload.clientEmail) return 'Missing clientEmail';
    return null;
}

// ===== TESTS =====

describe('Contract Type Mapping', () => {
    it('should map reserva to reserva', () => {
        expect(mapContractType('reserva')).toBe('reserva');
    });

    it('should map compraventa_final to compraventa', () => {
        expect(mapContractType('compraventa_final')).toBe('compraventa');
    });

    it('should map encargo to encargo', () => {
        expect(mapContractType('encargo')).toBe('encargo');
    });

    it('should return original type for unknown values', () => {
        expect(mapContractType('unknown_type')).toBe('unknown_type');
    });
});

describe('Template ID Selection', () => {
    it('should select template 206669 for reserva', () => {
        expect(getTemplateId('reserva')).toBe(206669);
    });

    it('should select template 208468 for encargo', () => {
        expect(getTemplateId('encargo')).toBe(208468);
    });

    it('should select template 206808 for compraventa_final', () => {
        expect(getTemplateId('compraventa_final')).toBe(206808);
    });

    it('should default to 206808 for unknown types', () => {
        expect(getTemplateId('unknown')).toBe(206808);
    });
});

describe('Comprador Bloque Generation', () => {
    const baseRecord = {
        client_full_name: 'María López García',
        client_dni: '12345678A',
        client_phone: '+34 612345678',
        client_email: 'maria@example.com',
    };

    it('should generate individual format when no company', () => {
        const bloque = generateCompradorBloque(baseRecord, 'Calle Mayor 1, Madrid');

        expect(bloque).toContain('María López García');
        expect(bloque).toContain('12345678A');
        expect(bloque).toContain('Calle Mayor 1, Madrid');
        expect(bloque).toContain('En adelante EL COMPRADOR');
        expect(bloque).not.toContain('mercantil');
    });

    it('should generate company format when billing_entity_name differs from client', () => {
        const companyRecord = {
            ...baseRecord,
            billing_entity_name: 'Empresa SL',
            billing_address: 'Polígono Industrial 5',
            billing_entity_nif: 'B12345678',
        };
        const bloque = generateCompradorBloque(companyRecord, 'Calle Mayor 1, Madrid');

        expect(bloque).toContain('mercantil Empresa SL');
        expect(bloque).toContain('C.I.F. B12345678');
        expect(bloque).toContain('Polígono Industrial 5');
    });

    it('should use individual format when billing_entity_name equals client name', () => {
        const sameNameRecord = {
            ...baseRecord,
            billing_entity_name: 'María López García',
        };
        const bloque = generateCompradorBloque(sameNameRecord, 'Calle Mayor 1, Madrid');

        expect(bloque).not.toContain('mercantil');
    });

    it('should handle empty fields gracefully', () => {
        const bloque = generateCompradorBloque({}, '');

        expect(bloque).toContain('D./Dª.');
        expect(bloque).toContain('En adelante EL COMPRADOR');
    });
});

describe('Spanish Price Formatting', () => {
    it('should format integer prices with 2 decimal places', () => {
        const formatted = formatSpanishPrice(1000);
        expect(formatted).toContain(',00');
    });

    it('should format decimal prices correctly', () => {
        const formatted = formatSpanishPrice(1234.56);
        expect(formatted).toContain('1234,56');
    });

    it('should format zero', () => {
        expect(formatSpanishPrice(0)).toBe('0,00');
    });

    it('should round to 2 decimal places', () => {
        const formatted = formatSpanishPrice(99.999);
        expect(formatted).toContain('100');
    });
});

describe('Common Fields — Billing Data Always Included', () => {
    it('should include billing fields for reserva', () => {
        const fields = buildCommonFields({
            client_full_name: 'Test Client',
            billing_entity_name: 'Empresa SL',
            billing_address: 'Calle Empresa 1',
            billing_entity_nif: 'B12345678',
        });
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).toContain('billing_entity_name');
        expect(fieldNames).toContain('billing_address');
        expect(fieldNames).toContain('billing_entity_nif');
        expect(fieldNames).toContain('client_name');
        expect(fieldNames).toContain('client_email');
        expect(fieldNames).toContain('client_dni');
    });

    it('should include billing fields even for personal clients', () => {
        const fields = buildCommonFields({
            client_full_name: 'Personal Client',
        });
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).toContain('billing_entity_name');
        expect(fieldNames).toContain('billing_address');
        expect(fieldNames).toContain('billing_entity_nif');
    });
});

describe('Specific Fields — Reserva', () => {
    it('should include only importe_reserva', () => {
        const fields = buildSpecificFields('reserva', { payment_reserve: 3000 }, 0, 0);
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).toEqual(['importe_reserva']);
        expect(fields[0].value).toContain('3');
    });

    it('should NOT include vehicle fields', () => {
        const fields = buildSpecificFields('reserva', {}, 0, 0);
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).not.toContain('modelo_nomade');
        expect(fieldNames).not.toContain('engine');
    });
});

describe('Specific Fields — Encargo', () => {
    it('should include precio_total, importe_reserva, and pago_encargo', () => {
        const fields = buildSpecificFields('encargo', {
            total_price: 55000,
            payment_reserve: 3000,
            payment_first_amount: 15000,
        }, 0, 0);
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).toContain('precio_total');
        expect(fieldNames).toContain('importe_reserva');
        expect(fieldNames).toContain('pago_encargo');
    });

    it('should NOT include vehicle fields', () => {
        const fields = buildSpecificFields('encargo', {}, 0, 0);
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).not.toContain('modelo_nomade');
        expect(fieldNames).not.toContain('engine');
    });

    it('should NOT include old 3-payment fields', () => {
        const fields = buildSpecificFields('encargo', {}, 0, 0);
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).not.toContain('payment_first_percentage');
        expect(fieldNames).not.toContain('payment_second_percentage');
        expect(fieldNames).not.toContain('payment_third_percentage');
    });
});

describe('Specific Fields — Compraventa Final', () => {
    it('should include vehicle fields', () => {
        const fields = buildSpecificFields('compraventa_final', {
            total_price: 55000,
            vehicle_model: 'Neo',
            vehicle_engine: '2.0 TDI',
            vehicle_vin: 'VIN123',
            vehicle_plate: '1234ABC',
            payment_last_manual: 37000,
        }, 3000, 15000);
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).toContain('modelo_nomade');
        expect(fieldNames).toContain('engine');
        expect(fieldNames).toContain('vin_number');
        expect(fieldNames).toContain('plate_number');
    });

    it('should include auto-fetched reserva and encargo amounts', () => {
        const fields = buildSpecificFields('compraventa_final', {
            total_price: 55000,
            payment_last_manual: 37000,
        }, 3000, 15000);
        const fieldNames = fields.map(f => f.name);

        expect(fieldNames).toContain('importe_reserva');
        expect(fieldNames).toContain('pago_encargo');
        expect(fieldNames).toContain('ultimo_pago');
        expect(fieldNames).toContain('pendiente');
    });

    it('should calculate pendiente correctly (exact pay)', () => {
        // 55000 - 3000 - 15000 - 37000 = 0
        const fields = buildSpecificFields('compraventa_final', {
            total_price: 55000,
            payment_last_manual: 37000,
        }, 3000, 15000);
        const pendiente = fields.find(f => f.name === 'pendiente');

        expect(pendiente?.value).toBe('0,00');
    });

    it('should calculate pendiente correctly (underpaid)', () => {
        // 55000 - 3000 - 15000 - 30000 = 7000
        const fields = buildSpecificFields('compraventa_final', {
            total_price: 55000,
            payment_last_manual: 30000,
        }, 3000, 15000);
        const pendiente = fields.find(f => f.name === 'pendiente');

        expect(pendiente?.value).toContain('7');
    });

    it('should cap pendiente at 0 when overpaid', () => {
        // 55000 - 3000 - 15000 - 40000 = -3000 → capped at 0
        const fields = buildSpecificFields('compraventa_final', {
            total_price: 55000,
            payment_last_manual: 40000,
        }, 3000, 15000);
        const pendiente = fields.find(f => f.name === 'pendiente');

        expect(pendiente?.value).toBe('0,00');
    });
});

describe('Contract PDF Payload Validation', () => {
    it('should pass with valid payload', () => {
        expect(validateContractPayload({
            contractId: 'abc-123',
            htmlContent: '<h1>Contract</h1>',
        })).toBeNull();
    });

    it('should fail without contractId', () => {
        expect(validateContractPayload({ htmlContent: '<h1>Test</h1>' }))
            .toBe('Missing contractId');
    });

    it('should fail without htmlContent', () => {
        expect(validateContractPayload({ contractId: 'abc-123' }))
            .toBe('Missing htmlContent');
    });
});

describe('Email Payload Validation', () => {
    it('should pass with required fields', () => {
        expect(validateEmailPayload({
            contractId: 'abc-123',
            clientEmail: 'test@example.com',
        })).toBeNull();
    });

    it('should fail without contractId', () => {
        expect(validateEmailPayload({ clientEmail: 'test@example.com' }))
            .toBe('Missing contractId');
    });

    it('should fail without clientEmail', () => {
        expect(validateEmailPayload({ contractId: 'abc-123' }))
            .toBe('Missing clientEmail');
    });
});
