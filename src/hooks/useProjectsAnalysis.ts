
// ANÁLISIS DETALLADO DE USO DE HOOKS EN EL PROYECTO
// Este archivo documenta todos los usos actuales de hooks de proyectos

export const HOOKS_USAGE_ANALYSIS = {
  // ===== HOOKS PRINCIPALES =====
  PRIMARY_HOOKS: {
    useUnifiedProjectsList: {
      file: 'src/hooks/useUnifiedProjects.ts',
      queryKey: ['unified-projects'],
      dataSource: 'NEW_Projects + NEW_Clients + NEW_Vehicles + NEW_Budget',
      returnType: 'UnifiedProject[]',
      usedIn: [
        'src/pages/Proyectos.tsx'
      ]
    },
    useProjectsList: {
      file: 'src/hooks/useNewProjects.ts',
      queryKey: ['new-projects-list'],
      dataSource: 'NEW_Projects + NEW_Clients',
      returnType: 'Simplified project array',
      usedIn: [
        'src/pages/Proyectos.tsx'
      ]
    },
    useUnifiedProject: {
      file: 'src/hooks/useUnifiedProjects.ts',
      queryKey: ['unified-project', 'projectId'],
      dataSource: 'NEW_Projects + NEW_Clients + NEW_Vehicles + NEW_Budget + phases',
      returnType: 'UnifiedProject',
      usedIn: [
        'src/pages/ProjectDetail.tsx'
      ]
    },
    useProject: {
      file: 'src/hooks/useNewProjects.ts',
      queryKey: ['new-project', 'projectId'],
      dataSource: 'NEW_Projects + NEW_Clients + phases',
      returnType: 'Simplified project',
      usedIn: [
        'src/pages/ProjectDetail.tsx'
      ]
    }
  },

  // ===== COMPONENTES CON CONFLICTOS =====
  CONFLICTING_COMPONENTS: {
    'src/pages/Proyectos.tsx': {
      currentHooks: [
        'useUnifiedProjectsList()',
        'useProjectsList()'
      ],
      risk: 'HIGH',
      issues: [
        'Usa ambos hooks simultáneamente',
        'Query keys diferentes causan inconsistencias',
        'Datos pueden diferir entre hooks'
      ],
      migrationStrategy: 'Reemplazar ambos con useConsolidatedProjectsList'
    },
    'src/pages/ProjectDetail.tsx': {
      currentHooks: [
        'useUnifiedProject(id)'
      ],
      risk: 'MEDIUM',
      issues: [
        'Solo usa hook unificado, pero depende de datos de otros hooks'
      ],
      migrationStrategy: 'Reemplazar con useConsolidatedProject'
    }
  },

  // ===== HOOKS SECUNDARIOS =====
  SECONDARY_HOOKS: {
    useProjectPhases: {
      file: 'src/hooks/useUnifiedProjects.ts',
      queryKey: ['unified-projects', 'phases', 'projectId'],
      usedIn: [
        'src/components/projects/ProjectPhasesChecklist.tsx'
      ]
    },
    useProjectStatusUpdater: {
      file: 'src/hooks/useProjectStatusUpdater.ts',
      queryKey: 'Mutations only',
      usedIn: [
        'src/components/projects/ProjectStatusUpdater.tsx'
      ]
    }
  },

  // ===== DIFERENCIAS CLAVE =====
  KEY_DIFFERENCES: {
    dataMapping: {
      useUnifiedProjectsList: {
        code: 'client_code for prospects, project_code for clients',
        model: 'From primary budget model_option',
        power: 'From primary budget engine_option with power + transmission',
        client_name: 'From NEW_Clients.name'
      },
      useProjectsList: {
        code: 'Always project_code',
        model: 'Hardcoded "Por definir"',
        power: 'Hardcoded "Por definir"',
        client_name: 'From NEW_Clients.name'
      }
    },
    queryInvalidation: {
      useUnifiedProjectsList: [
        'unified-projects',
        'unified-project',
        'production-slots'
      ],
      useProjectsList: [
        'new-projects-list',
        'new-project'
      ]
    }
  }
};

// ===== STRATEGY FOR SAFE MIGRATION =====
export const SAFE_MIGRATION_STRATEGY = {
  STEP_1: {
    title: "Verificar hook híbrido",
    description: "Asegurar que useConsolidatedProjectsList funciona correctamente",
    tests: [
      "Verificar que retorna los mismos datos que useUnifiedProjectsList",
      "Verificar que mantiene compatibilidad con useProjectsList",
      "Verificar que query keys son correctas"
    ]
  },
  STEP_2: {
    title: "Migrar página principal",
    description: "Migrar src/pages/Proyectos.tsx primero",
    changes: [
      "Reemplazar useUnifiedProjectsList con useConsolidatedProjectsList",
      "Reemplazar useProjectsList con useConsolidatedProjectsList",
      "Verificar que la UI funciona igual"
    ]
  },
  STEP_3: {
    title: "Migrar página de detalle",
    description: "Migrar src/pages/ProjectDetail.tsx",
    changes: [
      "Reemplazar useUnifiedProject con useConsolidatedProject",
      "Verificar que todos los datos se muestran correctamente"
    ]
  },
  STEP_4: {
    title: "Migrar componentes restantes",
    description: "Migrar resto de componentes que usan hooks duplicados",
    changes: [
      "Actualizar ProjectPhasesChecklist.tsx",
      "Actualizar ProjectSpecsFromBudget.tsx",
      "Actualizar ProjectSummary.tsx"
    ]
  },
  STEP_5: {
    title: "Limpieza final",
    description: "Eliminar hooks obsoletos",
    changes: [
      "Eliminar useProjectsList de useNewProjects.ts",
      "Eliminar useProject de useNewProjects.ts",
      "Limpiar exports duplicados",
      "Actualizar imports"
    ]
  }
};


