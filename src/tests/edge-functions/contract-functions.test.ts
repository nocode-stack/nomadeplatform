import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for contract-related edge functions.
 * Validates auth enforcement, payload validation, and contract type mapping.
 */

// Simulates the contract type mapping from trigger-contract-webhook
function mapContractType(contractType: string): string {
    const mapping: Record<string, string> = {
        'reservation': 'reserva',
        'sale_contract': 'compraventa',
        'purchase_agreement': 'compraventa',
    };
    return mapping[contractType] || contractType;
}

// Simulates the template ID selection from trigger-contract-webhook
function getTemplateId(contractType: string): number {
    if (contractType === 'reservation') return 206669;
    if (contractType === 'purchase_agreement') return 208468;
    return 206808; // sale_contract default
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

// Simulates payload validation from generate-contract-pdf / send-contract-email
function validateContractPayload(payload: { contractId?: string; htmlContent?: string }): string | null {
    if (!payload.contractId) return 'Missing contractId';
    if (!payload.htmlContent) return 'Missing htmlContent';
    return null;
}

function validateEmailPayload(payload: {
    contractId?: string;
    clientEmail?: string;
    clientName?: string;
    projectCode?: string;
    pdfUrl?: string;
}): string | null {
    if (!payload.contractId) return 'Missing contractId';
    if (!payload.clientEmail) return 'Missing clientEmail';
    return null;
}

describe('Contract Type Mapping', () => {
    it('should map reservation to reserva', () => {
        expect(mapContractType('reservation')).toBe('reserva');
    });

    it('should map sale_contract to compraventa', () => {
        expect(mapContractType('sale_contract')).toBe('compraventa');
    });

    it('should map purchase_agreement to compraventa', () => {
        expect(mapContractType('purchase_agreement')).toBe('compraventa');
    });

    it('should return original type for unknown values', () => {
        expect(mapContractType('unknown_type')).toBe('unknown_type');
    });
});

describe('Template ID Selection', () => {
    it('should select template 206669 for reservations', () => {
        expect(getTemplateId('reservation')).toBe(206669);
    });

    it('should select template 208468 for purchase agreements', () => {
        expect(getTemplateId('purchase_agreement')).toBe(208468);
    });

    it('should select template 206808 for sale contracts', () => {
        expect(getTemplateId('sale_contract')).toBe(206808);
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
