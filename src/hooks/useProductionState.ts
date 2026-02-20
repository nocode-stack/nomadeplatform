
import { useState, useEffect } from 'react';
import { ProductionProject, Box, ProjectPhase } from '../types/production';
import { mockProductionProjects, boxes as initialBoxes } from '../data/productionData';
import { logger } from '../utils/logger';

const STORAGE_KEY = 'nomade-production-data';

interface ProductionState {
  projects: ProductionProject[];
  boxes: Box[];
}

export const useProductionState = () => {
  const [state, setState] = useState<ProductionState>({
    projects: mockProductionProjects,
    boxes: initialBoxes
  });

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setState(parsedData);
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateProject = (projectId: string, updates: Partial<ProductionProject>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === projectId ? { ...project, ...updates } : project
      )
    }));
  };

  const updateProjectPhase = (projectId: string, phaseId: string, updates: Partial<ProjectPhase>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project => {
        if (project.id === projectId) {
          const updatedPhases = project.phases.map(phase =>
            phase.phaseId === phaseId ? { ...phase, ...updates } : phase
          );
          return { ...project, phases: updatedPhases };
        }
        return project;
      })
    }));
  };

  const validatePhase = (projectId: string, phaseId: string, notes: string, operatorId: string) => {
    const now = new Date().toISOString();

    setState(prev => {
      const project = prev.projects.find(p => p.id === projectId);
      if (!project) return prev;

      // Actualizar la fase como completada
      const updatedPhases = project.phases.map(phase => {
        if (phase.phaseId === phaseId) {
          return {
            ...phase,
            status: 'completed' as const,
            actualEndDate: now,
            operatorNotes: notes,
            validatedBy: operatorId,
            validatedAt: now
          };
        }
        return phase;
      });

      // Encontrar la siguiente fase pendiente y activarla
      const completedPhases = updatedPhases.filter(p => p.status === 'completed');
      const nextPendingPhase = updatedPhases.find(p => p.status === 'pending');

      if (nextPendingPhase) {
        const phaseIndex = updatedPhases.findIndex(p => p.id === nextPendingPhase.id);
        updatedPhases[phaseIndex] = {
          ...nextPendingPhase,
          status: 'active',
          actualStartDate: now
        };
      }

      // Calcular nuevo progreso
      const totalPhases = updatedPhases.length;
      const completedPhasesCount = updatedPhases.filter(p => p.status === 'completed').length;
      const newProgress = Math.round((completedPhasesCount / totalPhases) * 100);

      // Actualizar box actual si hay siguiente fase
      const activePhase = updatedPhases.find(p => p.status === 'active');
      const currentPhaseData = activePhase ?
        prev.projects.find(proj => proj.id === projectId)?.phases.find(ph => ph.id === activePhase.id) : null;

      return {
        ...prev,
        projects: prev.projects.map(proj =>
          proj.id === projectId ? {
            ...proj,
            phases: updatedPhases,
            progress: newProgress,
            currentPhaseId: activePhase?.phaseId || null,
            currentBoxId: currentPhaseData ? getBoxIdForPhase(currentPhaseData.phaseId) : null
          } : proj
        )
      };
    });

    logger.production.slotUpdate(projectId, { phaseId, notes });
  };

  const updateBoxLoad = () => {
    setState(prev => {
      const updatedBoxes = prev.boxes.map(box => {
        const projectsInBox = prev.projects.filter(project => project.currentBoxId === box.id);
        return {
          ...box,
          currentLoad: projectsInBox.length,
          status: projectsInBox.length > 0 ? 'active' : 'idle'
        } as Box;
      });

      return {
        ...prev,
        boxes: updatedBoxes
      };
    });
  };

  // Actualizar carga de boxes cuando cambien los proyectos
  useEffect(() => {
    updateBoxLoad();
  }, [state.projects]);

  return {
    projects: state.projects,
    boxes: state.boxes,
    updateProject,
    updateProjectPhase,
    validatePhase
  };
};

// Función auxiliar para obtener el boxId de una fase
const getBoxIdForPhase = (phaseId: string): string | null => {
  const phaseToBoxMap: Record<string, string> = {
    'p1': 'b1', 'p2': 'b1',
    'p3': 'b2', 'p4': 'b2',
    'p5': 'b3.2', 'p6': 'b3.2',
    'p7': 'b4', 'p8': 'b4',
    'p9': 'b5',
    'p10': 'b0.3'
  };
  return phaseToBoxMap[phaseId] || null;
};
