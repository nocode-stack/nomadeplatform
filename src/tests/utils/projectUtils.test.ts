import { describe, it, expect } from 'vitest';
import {
    calculateProjectStatus,
    calculateProjectProgress,
    calculateProjectPriority,
    getStatusText,
    getStatusColor,
    getPriorityText,
    getPriorityColor,
    formatDate,
    enhanceProjectWithComputedProps,
    PROJECT_PHASE_GROUPS
} from '../../utils/projectUtils';

describe('projectUtils', () => {
    describe('calculateProjectStatus', () => {
        it('should return project status when present', () => {
            const project = { status: 'production' } as any;
            expect(calculateProjectStatus(project)).toBe('production');
        });

        it('should return creacion_cliente when status is missing', () => {
            const project = {} as any;
            expect(calculateProjectStatus(project)).toBe('creacion_cliente');
        });
    });

    describe('calculateProjectProgress', () => {
        it('should return progress when present', () => {
            expect(calculateProjectProgress({ progress: 75 } as any)).toBe(75);
        });

        it('should return 0 when progress is missing', () => {
            expect(calculateProjectProgress({} as any)).toBe(0);
        });
    });

    describe('calculateProjectPriority', () => {
        it('should return priority when present', () => {
            expect(calculateProjectPriority({ priority: 'high' } as any)).toBe('high');
        });

        it('should return medium when priority is missing', () => {
            expect(calculateProjectPriority({} as any)).toBe('medium');
        });
    });

    describe('getStatusText', () => {
        it('should map creacion_cliente correctly', () => {
            expect(getStatusText('creacion_cliente')).toBe('Creación de cliente');
        });

        it('should map production correctly', () => {
            expect(getStatusText('production')).toBe('Producción');
        });

        it('should map repair correctly', () => {
            expect(getStatusText('repair')).toBe('Reparación');
        });

        it('should map delivered correctly', () => {
            expect(getStatusText('delivered')).toBe('Entregado');
        });

        it('should return raw status for unknown values', () => {
            expect(getStatusText('unknown_status' as any)).toBe('unknown_status');
        });
    });

    describe('getStatusColor', () => {
        it('should return correct color for production', () => {
            expect(getStatusColor('production')).toBe('bg-orange-500');
        });

        it('should return correct color for delivered', () => {
            expect(getStatusColor('delivered')).toBe('bg-green-500');
        });

        it('should return gray for unknown status', () => {
            expect(getStatusColor('xyz' as any)).toBe('bg-gray-500');
        });
    });

    describe('getPriorityText', () => {
        it('should map low to Baja', () => {
            expect(getPriorityText('low')).toBe('Baja');
        });

        it('should map urgent to Urgente', () => {
            expect(getPriorityText('urgent')).toBe('Urgente');
        });

        it('should return raw value for unknown priority', () => {
            expect(getPriorityText('critical' as any)).toBe('critical');
        });
    });

    describe('getPriorityColor', () => {
        it('should return green for low', () => {
            expect(getPriorityColor('low')).toBe('bg-green-500');
        });

        it('should return red for urgent', () => {
            expect(getPriorityColor('urgent')).toBe('bg-red-500');
        });

        it('should return gray for unknown', () => {
            expect(getPriorityColor('abc' as any)).toBe('bg-gray-500');
        });
    });

    describe('formatDate', () => {
        it('should format a valid ISO date string', () => {
            const result = formatDate('2024-06-15');
            expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
        });

        it('should return dash for null', () => {
            expect(formatDate(null)).toBe('-');
        });

        it('should return dash for undefined', () => {
            expect(formatDate(undefined)).toBe('-');
        });

        it('should return dash for empty string', () => {
            expect(formatDate('')).toBe('-');
        });
    });

    describe('enhanceProjectWithComputedProps', () => {
        it('should set default status to creacion_cliente', () => {
            const result = enhanceProjectWithComputedProps({});
            expect(result.status).toBe('creacion_cliente');
        });

        it('should set default progress to 0', () => {
            const result = enhanceProjectWithComputedProps({});
            expect(result.progress).toBe(0);
        });

        it('should set default priority to medium', () => {
            const result = enhanceProjectWithComputedProps({});
            expect(result.priority).toBe('medium');
        });

        it('should preserve existing values', () => {
            const result = enhanceProjectWithComputedProps({
                status: 'production',
                progress: 50,
                priority: 'high',
            });
            expect(result.status).toBe('production');
            expect(result.progress).toBe(50);
            expect(result.priority).toBe('high');
        });
    });

    describe('PROJECT_PHASE_GROUPS', () => {
        it('should have 7 phases', () => {
            expect(PROJECT_PHASE_GROUPS).toHaveLength(7);
        });

        it('should include repair phase', () => {
            expect(PROJECT_PHASE_GROUPS.find(p => p.id === 'repair')).toBeDefined();
        });
    });
});
