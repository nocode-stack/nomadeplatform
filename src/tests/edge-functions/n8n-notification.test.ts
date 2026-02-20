import { describe, it, expect } from 'vitest';

/**
 * Tests for the n8n-notification edge function logic.
 * Verifies payload structure and ensures no PII is leaked.
 */

interface Incident {
    id: string;
    reference_number: string;
    description: string;
    status?: { label: string };
    project?: {
        id: string;
        project_code: string;
        client?: { name: string; email?: string; phone?: string; dni?: string };
    };
}

// Simulates the payload transformation from the n8n-notification edge function
function buildN8nPayload(incident: Incident, appUrl: string) {
    let cleanDescription = incident.description;
    if (incident.description && incident.description.includes('concepto(s): ')) {
        cleanDescription = incident.description.split('concepto(s): ')[1] || incident.description;
    }

    const incidentUrl = `${appUrl}/proyectos/${incident.project?.id}?tab=incidencias&incident=${incident.id}`;

    return {
        title: incident.reference_number,
        description: cleanDescription,
        status: incident.status?.label,
        project_code: incident.project?.project_code,
        created_by: incident.project?.client?.name,
        incident_id: incident.id,
        project_id: incident.project?.id,
        incident_url: incidentUrl,
    };
}

describe('N8N Notification - Payload Structure', () => {
    const mockIncident: Incident = {
        id: 'inc-123',
        reference_number: 'INC-2025-001',
        description: 'Se han reportado 3 concepto(s): Fallo en climatización, Ruido en motor, Fuga de agua',
        status: { label: 'Pendiente' },
        project: {
            id: 'proj-456',
            project_code: 'NOM-2025-100',
            client: {
                name: 'Juan García',
                email: 'juan@example.com',
                phone: '+34 612345678',
                dni: '12345678A',
            },
        },
    };

    it('should build correct payload structure', () => {
        const payload = buildN8nPayload(mockIncident, 'https://app.nomade.com');

        expect(payload).toHaveProperty('title');
        expect(payload).toHaveProperty('description');
        expect(payload).toHaveProperty('status');
        expect(payload).toHaveProperty('project_code');
        expect(payload).toHaveProperty('incident_id');
        expect(payload).toHaveProperty('project_id');
        expect(payload).toHaveProperty('incident_url');
    });

    it('should strip concept prefix from description', () => {
        const payload = buildN8nPayload(mockIncident, 'https://app.nomade.com');

        expect(payload.description).toBe('Fallo en climatización, Ruido en motor, Fuga de agua');
        expect(payload.description).not.toContain('concepto(s):');
    });

    it('should keep description as-is when no concept prefix exists', () => {
        const simpleIncident = { ...mockIncident, description: 'Simple issue report' };
        const payload = buildN8nPayload(simpleIncident, 'https://app.nomade.com');

        expect(payload.description).toBe('Simple issue report');
    });

    it('should build correct incident URL', () => {
        const payload = buildN8nPayload(mockIncident, 'https://app.nomade.com');

        expect(payload.incident_url).toBe('https://app.nomade.com/proyectos/proj-456?tab=incidencias&incident=inc-123');
    });

    it('should NOT include sensitive client PII in the payload', () => {
        const payload = buildN8nPayload(mockIncident, 'https://app.nomade.com');
        const payloadStr = JSON.stringify(payload);

        // Only client name should be present (as created_by), not email/phone/DNI
        expect(payload.created_by).toBe('Juan García');
        expect(payloadStr).not.toContain('juan@example.com');
        expect(payloadStr).not.toContain('+34 612345678');
        expect(payloadStr).not.toContain('12345678A');
    });

    it('should use client name as created_by', () => {
        const payload = buildN8nPayload(mockIncident, 'https://app.nomade.com');

        expect(payload.created_by).toBe('Juan García');
    });

    it('should handle missing project data gracefully', () => {
        const noProjectIncident: Incident = {
            id: 'inc-999',
            reference_number: 'INC-2025-999',
            description: 'Test issue',
        };
        const payload = buildN8nPayload(noProjectIncident, 'https://app.nomade.com');

        expect(payload.project_code).toBeUndefined();
        expect(payload.created_by).toBeUndefined();
        expect(payload.project_id).toBeUndefined();
    });
});
