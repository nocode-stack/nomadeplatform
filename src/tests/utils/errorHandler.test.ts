import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler } from '../../utils/errorHandler';

// Mock logger
vi.mock('../../utils/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    toast: (...args: any[]) => mockToast(...args),
}));

describe('ErrorHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('handle', () => {
        it('should parse a standard Error and return AppError', () => {
            const err = new Error('Something went wrong');
            const result = ErrorHandler.handle(err, 'TestContext');

            expect(result.code).toBe('GENERIC_ERROR');
            expect(result.message).toBe('Something went wrong');
            expect(result.userMessage).toBe('Ha ocurrido un error inesperado.');
        });

        it('should detect network/fetch errors', () => {
            const err = new Error('Failed to fetch the resource');
            const result = ErrorHandler.handle(err, 'API');

            expect(result.code).toBe('NETWORK_ERROR');
            expect(result.userMessage).toBe('Error de conexión. Por favor, verifica tu conexión a internet.');
        });

        it('should detect validation errors', () => {
            const err = new Error('Field validation failed');
            const result = ErrorHandler.handle(err, 'Form');

            expect(result.code).toBe('VALIDATION_ERROR');
            expect(result.userMessage).toBe('Por favor, revisa los datos ingresados.');
        });

        it('should handle Supabase-like errors with code and details', () => {
            const err: any = new Error('Duplicate key');
            err.code = '23505';
            err.details = 'Key already exists';
            const result = ErrorHandler.handle(err, 'DB');

            expect(result.code).toBe('23505');
            expect(result.userMessage).toBe('Ya existe un registro con esos datos.');
        });

        it('should handle string errors', () => {
            const result = ErrorHandler.handle('Something broke', 'Test');

            expect(result.code).toBe('STRING_ERROR');
            expect(result.message).toBe('Something broke');
            expect(result.userMessage).toBe('Something broke');
        });

        it('should handle unknown error types gracefully', () => {
            const result = ErrorHandler.handle(42, 'Test');

            expect(result.code).toBe('UNKNOWN_ERROR');
            expect(result.userMessage).toBe('Ha ocurrido un error desconocido.');
        });

        it('should show a toast notification', () => {
            ErrorHandler.handle(new Error('Test'), 'Test');
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                variant: 'destructive',
                title: 'Error',
            }));
        });
    });

    describe('specific handlers', () => {
        it('handleDatabaseError should set Database context', () => {
            const result = ErrorHandler.handleDatabaseError(new Error('DB error'), 'insert');
            expect(result.code).toBe('GENERIC_ERROR');
        });

        it('handleValidationError should set Validation context', () => {
            const result = ErrorHandler.handleValidationError(new Error('Invalid required field'), 'login');
            expect(result.code).toBe('VALIDATION_ERROR');
        });

        it('handleNetworkError should set Network context', () => {
            const result = ErrorHandler.handleNetworkError(new Error('fetch timeout'), '/api/data');
            expect(result.code).toBe('NETWORK_ERROR');
        });
    });

    describe('Supabase error code mappings', () => {
        it('should map 23503 to dependency error', () => {
            const err: any = new Error('FK violation');
            err.code = '23503';
            err.details = 'foreign key';
            const result = ErrorHandler.handle(err);
            expect(result.userMessage).toBe('No se puede completar la operación debido a dependencias.');
        });

        it('should map 42501 to permissions error', () => {
            const err: any = new Error('Permission denied');
            err.code = '42501';
            err.details = 'insufficient_privilege';
            const result = ErrorHandler.handle(err);
            expect(result.userMessage).toBe('No tienes permisos para realizar esta acción.');
        });

        it('should map unknown Supabase code to generic DB error', () => {
            const err: any = new Error('Unknown DB issue');
            err.code = '99999';
            err.details = 'obscure';
            const result = ErrorHandler.handle(err);
            expect(result.userMessage).toBe('Error en la base de datos.');
        });
    });
});
