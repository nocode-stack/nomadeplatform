import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        logger.error('Uncaught render error', {
            component: 'ErrorBoundary',
            action: 'componentDidCatch',
            data: {
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
            },
        });
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="text-6xl">⚠️</div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Algo salió mal
                        </h1>
                        <p className="text-muted-foreground">
                            Ha ocurrido un error inesperado. Puedes intentar recargar la
                            página o volver al inicio.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left bg-destructive/10 rounded-lg p-4 text-sm">
                                <summary className="cursor-pointer font-medium text-destructive">
                                    Detalles del error (solo desarrollo)
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap text-xs text-destructive/80 overflow-auto max-h-48">
                                    {this.state.error.message}
                                    {'\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => (window.location.href = '/')}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Ir al inicio
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
