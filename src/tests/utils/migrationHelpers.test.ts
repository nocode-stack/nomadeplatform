import { describe, it, expect } from 'vitest';
import { replaceAllClientReferences, createMigrationScript } from '../../utils/migrationHelpers';

describe('migrationHelpers', () => {
    describe('replaceAllClientReferences', () => {
        it('should replace .clients? with .new_clients?', () => {
            const input = 'project.clients?.name';
            const result = replaceAllClientReferences(input);
            expect(result).toBe('project.new_clients?.name');
        });

        it('should replace multiple occurrences', () => {
            const input = 'a.clients?.name + b.clients?.email';
            const result = replaceAllClientReferences(input);
            expect(result).toBe('a.new_clients?.name + b.new_clients?.email');
        });

        it('should not replace non-matching patterns', () => {
            const input = 'something.clientData?.name';
            const result = replaceAllClientReferences(input);
            expect(result).toBe('something.clientData?.name');
        });

        it('should handle empty string', () => {
            expect(replaceAllClientReferences('')).toBe('');
        });
    });

    describe('createMigrationScript', () => {
        it('should return an array of file migration entries', () => {
            const result = createMigrationScript();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('each entry should have file and action properties', () => {
            const result = createMigrationScript();
            result.forEach(entry => {
                expect(entry).toHaveProperty('file');
                expect(entry).toHaveProperty('action');
                expect(typeof entry.file).toBe('string');
                expect(typeof entry.action).toBe('string');
            });
        });

        it('should include key project files', () => {
            const result = createMigrationScript();
            const files = result.map(e => e.file);
            expect(files).toContain('src/pages/ProyectoDetalle.tsx');
            expect(files).toContain('src/pages/Contratos.tsx');
        });
    });
});
