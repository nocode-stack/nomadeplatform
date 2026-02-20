
export interface QualityCheckItem {
  id: string;
  name: string;
  description: string;
  category: 'visual' | 'dimensional' | 'functional' | 'material' | 'finish';
  required: boolean;
  acceptanceCriteria: string;
  order: number;
}

export interface QualityTemplate {
  id: string;
  name: string;
  description: string;
  projectType: string;
  items: QualityCheckItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheck {
  id: string;
  itemId: string;
  projectId: string;
  inspectorId: string;
  status: 'pending' | 'passed' | 'failed' | 'not_applicable';
  notes?: string;
  photos: string[];
  checkedAt?: string;
  measurements?: {
    expected: string;
    actual: string;
    tolerance: string;
  };
}

export interface QualityInspection {
  id: string;
  projectId: string;
  projectCode: string;
  templateId: string;
  inspectorId: string;
  inspectorName: string;
  phase: 'pre_production' | 'in_process' | 'final' | 'packaging';
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  startedAt: string;
  completedAt?: string;
  approvedAt?: string;
  checks: QualityCheck[];
  overallNotes?: string;
  photos: string[];
  defectsFound: number;
  criticalDefects: number;
  passRate: number;
}

export interface QualityMetrics {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  averagePassRate: number;
  commonDefects: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  trendsLastMonth: Array<{
    date: string;
    passRate: number;
    inspections: number;
  }>;
}

export interface Inspector {
  id: string;
  name: string;
  email: string;
  level: 'junior' | 'senior' | 'lead';
  certifications: string[];
  specializations: QualityCheckItem['category'][];
}
