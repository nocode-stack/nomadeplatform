import { logger } from './logger';
import { toast } from '@/hooks/use-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  userMessage?: string;
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): AppError {
    const appError = this.parseError(error);
    
    // Log the error
    logger.error(
      `Error in ${context || 'unknown context'}: ${appError.message}`,
      {
        component: context,
        action: 'errorHandling',
        data: { code: appError.code, details: appError.details }
      }
    );

    // Show user-friendly toast
    toast({
      variant: "destructive",
      title: "Error",
      description: appError.userMessage || appError.message,
    });

    return appError;
  }

  private static parseError(error: unknown): AppError {
    if (error instanceof Error) {
      // Supabase errors
      if ('code' in error && 'details' in error) {
        return {
          code: (error as any).code || 'SUPABASE_ERROR',
          message: error.message,
          details: (error as any).details,
          userMessage: this.getSupabaseUserMessage((error as any).code)
        };
      }

      // Network/fetch errors
      if (error.message.includes('fetch')) {
        return {
          code: 'NETWORK_ERROR',
          message: error.message,
          userMessage: 'Error de conexión. Por favor, verifica tu conexión a internet.'
        };
      }

      // Validation errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        return {
          code: 'VALIDATION_ERROR',
          message: error.message,
          userMessage: 'Por favor, revisa los datos ingresados.'
        };
      }

      return {
        code: 'GENERIC_ERROR',
        message: error.message,
        userMessage: 'Ha ocurrido un error inesperado.'
      };
    }

    // String errors
    if (typeof error === 'string') {
      return {
        code: 'STRING_ERROR',
        message: error,
        userMessage: error
      };
    }

    // Unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      userMessage: 'Ha ocurrido un error desconocido.'
    };
  }

  private static getSupabaseUserMessage(code: string): string {
    const messages: Record<string, string> = {
      '23505': 'Ya existe un registro con esos datos.',
      '23503': 'No se puede completar la operación debido a dependencias.',
      '42P01': 'Error en la base de datos. Contacta al administrador.',
      'PGRST116': 'No se encontraron resultados.',
      'PGRST204': 'Operación completada sin resultados.',
      '42501': 'No tienes permisos para realizar esta acción.',
    };

    return messages[code] || 'Error en la base de datos.';
  }

  // Specific error handlers for common operations
  static handleDatabaseError(error: unknown, operation: string) {
    return this.handle(error, `Database:${operation}`);
  }

  static handleValidationError(error: unknown, form: string) {
    return this.handle(error, `Validation:${form}`);
  }

  static handleNetworkError(error: unknown, endpoint: string) {
    return this.handle(error, `Network:${endpoint}`);
  }
}