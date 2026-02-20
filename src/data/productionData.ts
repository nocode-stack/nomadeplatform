
import { Box, ProductionPhase, ProductionProject, Operator } from '../types/production';

export const boxes: Box[] = [
  {
    id: 'b1',
    name: 'Box B1',
    code: 'B1',
    description: 'Preparación inicial y estructura',
    capacity: 3,
    currentLoad: 2,
    status: 'active'
  },
  {
    id: 'b2',
    name: 'Box B2',
    code: 'B2',
    description: 'Instalación eléctrica y mecánica',
    capacity: 2,
    currentLoad: 1,
    status: 'active'
  },
  {
    id: 'b3.2',
    name: 'Box B3.2',
    code: 'B3.2',
    description: 'Montaje de componentes principales',
    capacity: 2,
    currentLoad: 2,
    status: 'active'
  },
  {
    id: 'b4',
    name: 'Box B4',
    code: 'B4',
    description: 'Acabados y pintura',
    capacity: 4,
    currentLoad: 1,
    status: 'active'
  },
  {
    id: 'b5',
    name: 'Box B5',
    code: 'B5',
    description: 'Control de calidad y pruebas',
    capacity: 2,
    currentLoad: 0,
    status: 'idle'
  },
  {
    id: 'b0.3',
    name: 'Box B0.3',
    code: 'B0.3',
    description: 'Preparación para entrega',
    capacity: 3,
    currentLoad: 1,
    status: 'active'
  }
];

export const productionPhases: ProductionPhase[] = [
  { id: 'p1', name: 'Preparación inicial', description: 'Preparación de materiales y estructura base', estimatedDays: 3, boxId: 'b1', order: 1, dependencies: [] },
  { id: 'p2', name: 'Estructura principal', description: 'Montaje de la estructura principal', estimatedDays: 5, boxId: 'b1', order: 2, dependencies: ['p1'] },
  { id: 'p3', name: 'Instalación eléctrica', description: 'Cableado y sistemas eléctricos', estimatedDays: 4, boxId: 'b2', order: 3, dependencies: ['p2'] },
  { id: 'p4', name: 'Instalación mecánica', description: 'Componentes mecánicos y motor', estimatedDays: 3, boxId: 'b2', order: 4, dependencies: ['p3'] },
  { id: 'p5', name: 'Montaje principal', description: 'Ensamblaje de componentes principales', estimatedDays: 6, boxId: 'b3.2', order: 5, dependencies: ['p4'] },
  { id: 'p6', name: 'Sistemas auxiliares', description: 'Instalación de sistemas auxiliares', estimatedDays: 2, boxId: 'b3.2', order: 6, dependencies: ['p5'] },
  { id: 'p7', name: 'Pintura base', description: 'Aplicación de pintura base', estimatedDays: 2, boxId: 'b4', order: 7, dependencies: ['p6'] },
  { id: 'p8', name: 'Acabados finales', description: 'Acabados y detalles finales', estimatedDays: 4, boxId: 'b4', order: 8, dependencies: ['p7'] },
  { id: 'p9', name: 'Control de calidad', description: 'Revisión completa y pruebas', estimatedDays: 2, boxId: 'b5', order: 9, dependencies: ['p8'] },
  { id: 'p10', name: 'Preparación entrega', description: 'Limpieza final y documentación', estimatedDays: 1, boxId: 'b0.3', order: 10, dependencies: ['p9'] }
];

export const mockProductionProjects: ProductionProject[] = [
  {
    id: '1',
    code: 'N2530',
    name: 'Saylem',
    model: 'Neo S',
    client: 'Saylem Cuevas',
    priority: 'high',
    estimatedDelivery: '2025-01-15',
    currentBoxId: 'b2',
    currentPhaseId: 'p3',
    progress: 35,
    phases: [
      { id: 'ph1-1', projectId: '1', phaseId: 'p1', status: 'completed', actualStartDate: '2024-12-01', actualEndDate: '2024-12-04', validatedBy: 'op1', validatedAt: '2024-12-04T10:00:00Z' },
      { id: 'ph1-2', projectId: '1', phaseId: 'p2', status: 'completed', actualStartDate: '2024-12-04', actualEndDate: '2024-12-09', validatedBy: 'op1', validatedAt: '2024-12-09T15:30:00Z' },
      { id: 'ph1-3', projectId: '1', phaseId: 'p3', status: 'active', actualStartDate: '2024-12-10', operatorId: 'op2' },
      { id: 'ph1-4', projectId: '1', phaseId: 'p4', status: 'pending' },
      { id: 'ph1-5', projectId: '1', phaseId: 'p5', status: 'pending' },
      { id: 'ph1-6', projectId: '1', phaseId: 'p6', status: 'pending' },
      { id: 'ph1-7', projectId: '1', phaseId: 'p7', status: 'pending' },
      { id: 'ph1-8', projectId: '1', phaseId: 'p8', status: 'pending' },
      { id: 'ph1-9', projectId: '1', phaseId: 'p9', status: 'pending' },
      { id: 'ph1-10', projectId: '1', phaseId: 'p10', status: 'pending' }
    ]
  },
  {
    id: '2',
    code: 'N4165',
    name: 'Ignasi',
    model: 'Neo S',
    client: 'Ignasi Martinez',
    priority: 'medium',
    estimatedDelivery: '2025-01-25',
    currentBoxId: 'b1',
    currentPhaseId: 'p2',
    progress: 20,
    phases: [
      { id: 'ph2-1', projectId: '2', phaseId: 'p1', status: 'completed', actualStartDate: '2024-12-05', actualEndDate: '2024-12-08', validatedBy: 'op1', validatedAt: '2024-12-08T14:00:00Z' },
      { id: 'ph2-2', projectId: '2', phaseId: 'p2', status: 'active', actualStartDate: '2024-12-09', operatorId: 'op1' },
      { id: 'ph2-3', projectId: '2', phaseId: 'p3', status: 'pending' },
      { id: 'ph2-4', projectId: '2', phaseId: 'p4', status: 'pending' },
      { id: 'ph2-5', projectId: '2', phaseId: 'p5', status: 'pending' },
      { id: 'ph2-6', projectId: '2', phaseId: 'p6', status: 'pending' },
      { id: 'ph2-7', projectId: '2', phaseId: 'p7', status: 'pending' },
      { id: 'ph2-8', projectId: '2', phaseId: 'p8', status: 'pending' },
      { id: 'ph2-9', projectId: '2', phaseId: 'p9', status: 'pending' },
      { id: 'ph2-10', projectId: '2', phaseId: 'p10', status: 'pending' }
    ]
  },
  {
    id: '3',
    code: 'N2847',
    name: 'Marina',
    model: 'Neo XL',
    client: 'Marina Rodriguez',
    priority: 'high',
    estimatedDelivery: '2025-01-20',
    currentBoxId: 'b4',
    currentPhaseId: 'p8',
    progress: 85,
    phases: [
      { id: 'ph3-1', projectId: '3', phaseId: 'p1', status: 'completed', actualStartDate: '2024-11-20', actualEndDate: '2024-11-23', validatedBy: 'op1', validatedAt: '2024-11-23T09:00:00Z' },
      { id: 'ph3-2', projectId: '3', phaseId: 'p2', status: 'completed', actualStartDate: '2024-11-23', actualEndDate: '2024-11-28', validatedBy: 'op1', validatedAt: '2024-11-28T16:00:00Z' },
      { id: 'ph3-3', projectId: '3', phaseId: 'p3', status: 'completed', actualStartDate: '2024-11-29', actualEndDate: '2024-12-03', validatedBy: 'op2', validatedAt: '2024-12-03T11:30:00Z' },
      { id: 'ph3-4', projectId: '3', phaseId: 'p4', status: 'completed', actualStartDate: '2024-12-03', actualEndDate: '2024-12-06', validatedBy: 'op2', validatedAt: '2024-12-06T13:45:00Z' },
      { id: 'ph3-5', projectId: '3', phaseId: 'p5', status: 'completed', actualStartDate: '2024-12-06', actualEndDate: '2024-12-12', validatedBy: 'op3', validatedAt: '2024-12-12T17:00:00Z' },
      { id: 'ph3-6', projectId: '3', phaseId: 'p6', status: 'completed', actualStartDate: '2024-12-12', actualEndDate: '2024-12-14', validatedBy: 'op3', validatedAt: '2024-12-14T10:15:00Z' },
      { id: 'ph3-7', projectId: '3', phaseId: 'p7', status: 'completed', actualStartDate: '2024-12-14', actualEndDate: '2024-12-16', validatedBy: 'op4', validatedAt: '2024-12-16T14:30:00Z' },
      { id: 'ph3-8', projectId: '3', phaseId: 'p8', status: 'active', actualStartDate: '2024-12-16', operatorId: 'op4' },
      { id: 'ph3-9', projectId: '3', phaseId: 'p9', status: 'pending' },
      { id: 'ph3-10', projectId: '3', phaseId: 'p10', status: 'pending' }
    ]
  }
];

export const operators: Operator[] = [
  { id: 'op1', name: 'Carlos Ruiz', boxIds: ['b1'], role: 'operator' },
  { id: 'op2', name: 'Ana López', boxIds: ['b2'], role: 'operator' },
  { id: 'op3', name: 'Miguel Santos', boxIds: ['b3.2'], role: 'supervisor' },
  { id: 'op4', name: 'Laura García', boxIds: ['b4'], role: 'operator' },
  { id: 'op5', name: 'David Martín', boxIds: ['b5'], role: 'operator' },
  { id: 'op6', name: 'Isabel Fernández', boxIds: ['b0.3'], role: 'operator' }
];
