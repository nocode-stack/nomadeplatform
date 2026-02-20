
export interface Box {
  id: string;
  name: string;
  code: string;
  description: string;
  capacity: number;
  currentLoad: number;
  status: 'active' | 'idle' | 'blocked';
}

export interface ProductionPhase {
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  boxId: string;
  order: number;
  dependencies: string[];
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  phaseId: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  operatorId?: string;
  operatorNotes?: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface ProductionProject {
  id: string;
  code: string;
  name: string;
  model: string;
  client: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDelivery: string;
  currentBoxId?: string;
  currentPhaseId?: string;
  phases: ProjectPhase[];
  progress: number;
}

export interface Operator {
  id: string;
  name: string;
  boxIds: string[];
  role: 'operator' | 'supervisor' | 'manager';
}

export type PhaseStatus = 'pending' | 'active' | 'completed' | 'blocked';
