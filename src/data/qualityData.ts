
import { QualityTemplate, QualityInspection, Inspector, QualityMetrics } from '../types/quality';

export const qualityTemplates: QualityTemplate[] = [
  {
    id: 'tpl_001',
    name: 'Control Estándar Mobiliario',
    description: 'Template básico para control de calidad de mobiliario estándar',
    projectType: 'furniture',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    items: [
      {
        id: 'item_001',
        name: 'Inspección Visual General',
        description: 'Verificar ausencia de defectos visuales evidentes',
        category: 'visual',
        required: true,
        acceptanceCriteria: 'Sin rayones, golpes, manchas o defectos visibles',
        order: 1
      },
      {
        id: 'item_002',
        name: 'Control Dimensional',
        description: 'Verificar medidas según planos',
        category: 'dimensional',
        required: true,
        acceptanceCriteria: 'Tolerancia ±2mm en medidas principales',
        order: 2
      },
      {
        id: 'item_003',
        name: 'Acabado Superficial',
        description: 'Calidad del acabado y pintura/barniz',
        category: 'finish',
        required: true,
        acceptanceCriteria: 'Acabado uniforme, sin burbujas ni imperfecciones',
        order: 3
      },
      {
        id: 'item_004',
        name: 'Funcionalidad Herrajes',
        description: 'Verificar funcionamiento de bisagras, tiradores, etc.',
        category: 'functional',
        required: true,
        acceptanceCriteria: 'Apertura/cierre suave, sin holguras excesivas',
        order: 4
      },
      {
        id: 'item_005',
        name: 'Calidad Material',
        description: 'Verificar materiales según especificaciones',
        category: 'material',
        required: true,
        acceptanceCriteria: 'Material conforme a especificaciones técnicas',
        order: 5
      }
    ]
  },
  {
    id: 'tpl_002',
    name: 'Control Premium',
    description: 'Template avanzado para proyectos de alta gama',
    projectType: 'premium',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    items: [
      {
        id: 'item_006',
        name: 'Inspección Detallada Juntas',
        description: 'Control exhaustivo de todas las uniones',
        category: 'dimensional',
        required: true,
        acceptanceCriteria: 'Juntas perfectas, sin gaps visibles',
        order: 1
      },
      {
        id: 'item_007',
        name: 'Acabado Espejo',
        description: 'Verificar calidad de acabado premium',
        category: 'finish',
        required: true,
        acceptanceCriteria: 'Superficie perfecta, sin marcas ni imperfecciones',
        order: 2
      }
    ]
  }
];

export const inspectors: Inspector[] = [
  {
    id: 'insp_001',
    name: 'Miguel Torres',
    email: 'calidad@nomade.com',
    level: 'lead',
    certifications: ['ISO 9001', 'Six Sigma Black Belt'],
    specializations: ['visual', 'dimensional', 'finish']
  },
  {
    id: 'insp_002',
    name: 'Carmen Vega',
    email: 'carmen.vega@nomade.com',
    level: 'senior',
    certifications: ['ISO 9001'],
    specializations: ['functional', 'material']
  },
  {
    id: 'insp_003',
    name: 'Roberto Sánchez',
    email: 'roberto.sanchez@nomade.com',
    level: 'junior',
    certifications: [],
    specializations: ['visual', 'material']
  }
];

export const mockInspections: QualityInspection[] = [
  {
    id: 'qc_001',
    projectId: 'proj_004',
    projectCode: 'NON-2024-004',
    templateId: 'tpl_001',
    inspectorId: 'insp_001',
    inspectorName: 'Miguel Torres',
    phase: 'final',
    status: 'completed',
    startedAt: '2024-06-26T08:00:00Z',
    completedAt: '2024-06-26T10:30:00Z',
    defectsFound: 2,
    criticalDefects: 0,
    passRate: 80,
    overallNotes: 'Proyecto en buen estado general. Defectos menores en acabado.',
    photos: ['photo1.jpg', 'photo2.jpg'],
    checks: [
      {
        id: 'check_001',
        itemId: 'item_001',
        projectId: 'proj_004',
        inspectorId: 'insp_001',
        status: 'passed',
        notes: 'Sin defectos visuales evidentes',
        photos: ['visual_check.jpg'],
        checkedAt: '2024-06-26T08:30:00Z'
      },
      {
        id: 'check_002',
        itemId: 'item_002',
        projectId: 'proj_004',
        inspectorId: 'insp_001',
        status: 'passed',
        notes: 'Medidas dentro de tolerancia',
        photos: ['dimensional_check.jpg'],
        checkedAt: '2024-06-26T09:00:00Z',
        measurements: {
          expected: '120.0 cm',
          actual: '119.8 cm',
          tolerance: '±2mm'
        }
      },
      {
        id: 'check_003',
        itemId: 'item_003',
        projectId: 'proj_004',
        inspectorId: 'insp_001',
        status: 'failed',
        notes: 'Pequeña burbuja en barniz lateral derecho',
        photos: ['finish_defect.jpg'],
        checkedAt: '2024-06-26T09:30:00Z'
      }
    ]
  },
  {
    id: 'qc_002',
    projectId: 'proj_005',
    projectCode: 'NON-2024-005',
    templateId: 'tpl_001',
    inspectorId: 'insp_002',
    inspectorName: 'Carmen Vega',
    phase: 'in_process',
    status: 'in_progress',
    startedAt: '2024-06-27T07:00:00Z',
    defectsFound: 0,
    criticalDefects: 0,
    passRate: 100,
    photos: [],
    checks: [
      {
        id: 'check_004',
        itemId: 'item_001',
        projectId: 'proj_005',
        inspectorId: 'insp_002',
        status: 'passed',
        notes: 'Correcto',
        photos: [],
        checkedAt: '2024-06-27T07:30:00Z'
      }
    ]
  }
];

export const mockQualityMetrics: QualityMetrics = {
  totalInspections: 45,
  passedInspections: 38,
  failedInspections: 7,
  averagePassRate: 84.4,
  commonDefects: [
    { category: 'Acabado', count: 15, percentage: 33.3 },
    { category: 'Dimensional', count: 8, percentage: 17.8 },
    { category: 'Funcional', count: 6, percentage: 13.3 },
    { category: 'Material', count: 4, percentage: 8.9 },
    { category: 'Visual', count: 3, percentage: 6.7 }
  ],
  trendsLastMonth: [
    { date: '2024-06-01', passRate: 82, inspections: 3 },
    { date: '2024-06-08', passRate: 87, inspections: 4 },
    { date: '2024-06-15', passRate: 79, inspections: 5 },
    { date: '2024-06-22', passRate: 91, inspections: 6 },
    { date: '2024-06-27', passRate: 85, inspections: 2 }
  ]
};
