
import { Project, ProjectMember, ProjectMilestone, ProjectAlert, ProjectResource } from '../types/projects';

// Miembros del equipo de ejemplo
const teamMembers: ProjectMember[] = [
  {
    id: '1',
    name: 'Arnau Mirallas',
    role: 'commercial',
    email: 'arnau@nomade.com',
    avatar: '/avatars/arnau.jpg'
  },
  {
    id: '2',
    name: 'Carlos Rodriguez',
    role: 'production_manager',
    email: 'carlos@nomade.com',
    avatar: '/avatars/carlos.jpg'
  },
  {
    id: '3',
    name: 'Ana Martinez',
    role: 'quality_inspector',
    email: 'ana@nomade.com',
    avatar: '/avatars/ana.jpg'
  },
  {
    id: '4',
    name: 'Luis Garcia',
    role: 'operator',
    email: 'luis@nomade.com',
    avatar: '/avatars/luis.jpg'
  },
  {
    id: '5',
    name: 'Maria Santos',
    role: 'delivery',
    email: 'maria@nomade.com',
    avatar: '/avatars/maria.jpg'
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Saylem',
    code: 'N2530',
    model: 'Neo S',
    client: {
      name: 'Saylem Cuevas',
      email: 'saylem@email.com',
      phone: '+34 666 123 456',
      address: 'Calle Mayor 123, Madrid'
    },
    commercial: teamMembers[0],
    status: 'in_production',
    priority: 'high',
    progress: 60,
    
    createdAt: '2024-10-15T09:00:00Z',
    updatedAt: '2024-12-20T14:30:00Z',
    startDate: '2024-11-16T08:00:00Z',
    plannedEndDate: '2024-12-30T17:00:00Z',
    deliveryDate: '2025-01-08T10:00:00Z',
    
    specifications: {
      power: '140cv',
      interiorColor: 'Gris',
      exteriorColor: 'Gris',
      year: '2025',
      serialNumber: '8675 MKJ',
      customFeatures: ['Sistema navegación avanzado', 'Asientos calefactables']
    },
    
    pricing: {
      totalAmount: 85000,
      paidAmount: 51000,
      pendingAmount: 34000,
      currency: 'EUR'
    },
    
    team: [teamMembers[0], teamMembers[1], teamMembers[3]],
    resources: [
      {
        id: 'r1',
        type: 'material',
        name: 'Madera de roble',
        quantity: 50,
        unit: 'm²',
        allocated: 30,
        status: 'in_use'
      },
      {
        id: 'r2',
        type: 'equipment',
        name: 'CNC Router',
        quantity: 1,
        unit: 'unidad',
        allocated: 1,
        status: 'in_use'
      }
    ],
    milestones: [
      {
        id: 'm1',
        name: 'Firma de contrato',
        dueDate: '2024-07-16T00:00:00Z',
        completedDate: '2024-07-16T14:30:00Z',
        status: 'completed',
        responsible: teamMembers[0],
        priority: 'high'
      },
      {
        id: 'm2',
        name: 'Pago del 60%',
        dueDate: '2024-09-22T00:00:00Z',
        status: 'overdue',
        responsible: teamMembers[0],
        priority: 'critical'
      },
      {
        id: 'm3',
        name: 'Final producción',
        dueDate: '2024-11-30T00:00:00Z',
        status: 'in_progress',
        responsible: teamMembers[1],
        priority: 'high'
      }
    ],
    alerts: [
      {
        id: 'a1',
        type: 'delay',
        severity: 'warning',
        message: 'Producción retrasada 2 días debido a retraso en materiales',
        createdAt: '2024-12-18T10:00:00Z',
        actionRequired: true
      },
      {
        id: 'a2',
        type: 'payment_pending',
        severity: 'critical',
        message: 'Pago del 60% pendiente desde hace 3 meses',
        createdAt: '2024-12-20T09:00:00Z',
        actionRequired: true
      }
    ],
    
    notes: 'Cliente muy exigente con los acabados. Revisar especialmente la calidad del barnizado.',
    documents: ['contrato_firmado.pdf', 'especificaciones_tecnicas.pdf'],
    images: ['proyecto_render.jpg', 'boceto_inicial.jpg'],
    
    metrics: {
      plannedDuration: 45,
      actualDuration: 47,
      budgetVariance: -5.2,
      qualityScore: 8.5
    }
  },
  {
    id: '2',
    name: 'Ignasi',
    code: 'N4165',
    model: 'Neo S',
    client: {
      name: 'Ignasi Martinez',
      email: 'ignasi@email.com',
      phone: '+34 677 234 567'
    },
    commercial: teamMembers[0],
    status: 'pre_production',
    priority: 'medium',
    progress: 31,
    
    createdAt: '2024-11-01T09:00:00Z',
    updatedAt: '2024-12-20T11:15:00Z',
    startDate: '2024-12-01T08:00:00Z',
    plannedEndDate: '2025-01-15T17:00:00Z',
    deliveryDate: '2025-01-22T10:00:00Z',
    
    specifications: {
      power: '120cv',
      interiorColor: 'Negro',
      exteriorColor: 'Blanco',
      year: '2025',
      serialNumber: '9234 LKM'
    },
    
    pricing: {
      totalAmount: 75000,
      paidAmount: 15000,
      pendingAmount: 60000,
      currency: 'EUR'
    },
    
    team: [teamMembers[0], teamMembers[1]],
    resources: [],
    milestones: [
      {
        id: 'm4',
        name: 'Definición del proyecto',
        dueDate: '2024-11-15T00:00:00Z',
        completedDate: '2024-11-14T16:00:00Z',
        status: 'completed',
        responsible: teamMembers[0],
        priority: 'medium'
      },
      {
        id: 'm5',
        name: 'Aprobación diseño',
        dueDate: '2024-12-10T00:00:00Z',
        status: 'in_progress',
        responsible: teamMembers[0],
        priority: 'high'
      }
    ],
    alerts: [],
    
    documents: ['propuesta_inicial.pdf'],
    images: ['diseño_3d.jpg'],
    
    metrics: {
      plannedDuration: 40,
      budgetVariance: 0
    }
  },
  {
    id: '3',
    name: 'Marina',
    code: 'N2847',
    model: 'Neo XL',
    client: {
      name: 'Marina Rodriguez',
      email: 'marina@email.com',
      phone: '+34 688 345 678'
    },
    commercial: teamMembers[0],
    status: 'delivery',
    priority: 'high',
    progress: 95,
    
    createdAt: '2024-09-01T09:00:00Z',
    updatedAt: '2024-12-20T16:45:00Z',
    startDate: '2024-10-01T08:00:00Z',
    plannedEndDate: '2024-12-15T17:00:00Z',
    actualEndDate: '2024-12-18T15:30:00Z',
    deliveryDate: '2024-12-22T14:00:00Z',
    
    specifications: {
      power: '180cv',
      interiorColor: 'Marrón',
      exteriorColor: 'Verde',
      year: '2025',
      serialNumber: '7891 QWE',
      customFeatures: ['Techo solar', 'Sistema de sonido premium']
    },
    
    pricing: {
      totalAmount: 120000,
      paidAmount: 120000,
      pendingAmount: 0,
      currency: 'EUR'
    },
    
    team: [teamMembers[0], teamMembers[1], teamMembers[2], teamMembers[4]],
    resources: [
      {
        id: 'r3',
        type: 'material',
        name: 'Cuero premium',
        quantity: 20,
        unit: 'm²',
        allocated: 20,
        status: 'in_use'
      }
    ],
    milestones: [
      {
        id: 'm6',
        name: 'Control de calidad final',
        dueDate: '2024-12-16T00:00:00Z',
        completedDate: '2024-12-17T11:00:00Z',
        status: 'completed',
        responsible: teamMembers[2],
        priority: 'critical'
      },
      {
        id: 'm7',
        name: 'Entrega programada',
        dueDate: '2024-12-22T00:00:00Z',
        status: 'pending',
        responsible: teamMembers[4],
        priority: 'high'
      }
    ],
    alerts: [
      {
        id: 'a3',
        type: 'delivery_scheduled',
        severity: 'info',
        message: 'Entrega programada para el 22 de diciembre a las 14:00',
        createdAt: '2024-12-20T08:00:00Z',
        actionRequired: false
      }
    ],
    
    documents: ['certificado_calidad.pdf', 'manual_usuario.pdf'],
    images: ['producto_final.jpg', 'detalles_acabado.jpg'],
    
    metrics: {
      plannedDuration: 75,
      actualDuration: 78,
      budgetVariance: 2.1,
      qualityScore: 9.2
    }
  }
];

export const getProjectStats = (projects: Project[]): any => {
  const total = projects.length;
  const byStatus = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byPriority = projects.reduce((acc, project) => {
    acc[project.priority] = (acc[project.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const overdue = projects.filter(p => 
    p.milestones.some(m => m.status === 'overdue')
  ).length;
  
  const withAlerts = projects.filter(p => p.alerts.length > 0).length;
  const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / total;
  
  return {
    total,
    byStatus,
    byPriority,
    overdue,
    withAlerts,
    avgProgress: Math.round(avgProgress)
  };
};
