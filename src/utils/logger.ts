type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  data?: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = this.getPrefix(level);
    const contextStr = context ? ` [${context.component || 'App'}${context.action ? '::' + context.action : ''}]` : '';
    return `${timestamp} ${prefix}${contextStr}: ${message}`;
  }

  private getPrefix(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return '📊';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, context);
      console.log(formatted, context?.data || '');
    }
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('info', message, context);
      console.info(formatted, context?.data || '');
    }
  }

  warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted, context?.data || '');
  }

  error(message: string, context?: LogContext) {
    const formatted = this.formatMessage('error', message, context);
    console.error(formatted, context?.data || '');
  }

  // Business-specific loggers
  budget = {
    create: (data: any) => this.info('Creating budget', { component: 'Budget', action: 'create', data }),
    update: (id: string, data: any) => this.info('Updating budget', { component: 'Budget', action: 'update', data: { id, ...data } }),
    delete: (id: string) => this.info('Deleting budget', { component: 'Budget', action: 'delete', data: { id } }),
    calculate: (calculations: any) => this.debug('Budget calculations', { component: 'Budget', action: 'calculate', data: calculations }),
  };

  project = {
    create: (data: any) => this.info('Creating project', { component: 'Project', action: 'create', data }),
    update: (id: string, data: any) => this.info('Updating project', { component: 'Project', action: 'update', data: { id, ...data } }),
    statusChange: (id: string, newStatus: string) => this.info('Project status changed', { component: 'Project', action: 'statusChange', data: { id, newStatus } }),
    phaseComplete: (projectId: string, phase: string) => this.info('Project phase completed', { component: 'Project', action: 'phaseComplete', data: { projectId, phase } }),
  };

  contract = {
    generate: (type: string, projectId: string) => this.info('Generating contract', { component: 'Contract', action: 'generate', data: { type, projectId } }),
    sign: (contractId: string) => this.info('Contract signed', { component: 'Contract', action: 'sign', data: { contractId } }),
    update: (contractId: string, data: any) => this.info('Updating contract', { component: 'Contract', action: 'update', data: { contractId, ...data } }),
  };

  incident = {
    create: (data: any) => this.info('Creating incident', { component: 'Incident', action: 'create', data }),
    update: (id: string, data: any) => this.info('Updating incident', { component: 'Incident', action: 'update', data: { id, ...data } }),
    statusChange: (id: string, newStatus: string) => this.info('Incident status changed', { component: 'Incident', action: 'statusChange', data: { id, newStatus } }),
  };

  production = {
    slotCreate: (data: any) => this.info('Creating production slot', { component: 'Production', action: 'slotCreate', data }),
    slotUpdate: (id: string, data: any) => this.info('Updating production slot', { component: 'Production', action: 'slotUpdate', data: { id, ...data } }),
    settingsUpdate: (data: any) => this.info('Updating production settings', { component: 'Production', action: 'settingsUpdate', data }),
  };

  vehicle = {
    create: (data: any) => this.info('Creating vehicle', { component: 'Vehicle', action: 'create', data }),
    assign: (vehicleId: string, projectId: string) => this.info('Assigning vehicle to project', { component: 'Vehicle', action: 'assign', data: { vehicleId, projectId } }),
    unassign: (vehicleId: string) => this.info('Unassigning vehicle', { component: 'Vehicle', action: 'unassign', data: { vehicleId } }),
  };
}

export const logger = new Logger();