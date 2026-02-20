
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import BoxCard from '../components/production/BoxCard';
import PhaseTimeline from '../components/production/PhaseTimeline';
import OperatorPanel from '../components/production/OperatorPanel';
import { useProductionState } from '../hooks/useProductionState';
import { productionPhases, operators } from '../data/productionData';
import { ProductionProject, Operator } from '../types/production';
import { Settings, Users, BarChart3, Filter, RefreshCw } from 'lucide-react';

const Produccion = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<'boxes' | 'timeline' | 'operator'>('boxes');
  const [selectedProject, setSelectedProject] = useState<ProductionProject | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [userRole] = useState<'operator' | 'supervisor' | 'manager'>('manager'); // Mock role

  const { projects, boxes, validatePhase } = useProductionState();

  const getProjectsByBox = (boxId: string) => {
    return projects.filter(project => project.currentBoxId === boxId);
  };

  const handleBoxClick = (boxId: string) => {
    const box = boxes.find(b => b.id === boxId);
    const boxProjects = getProjectsByBox(boxId);

    if (import.meta.env.DEV) {
      console.log(`📋 DETALLES DEL BOX ${box?.code}:`);
      console.log(`Nombre: ${box?.name}, Estado: ${box?.status}, Capacidad: ${box?.currentLoad}/${box?.capacity}`);
      console.log(`Proyectos actuales: ${boxProjects.length}`);
      if (boxProjects.length > 0) {
        boxProjects.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.code} - ${project.client} (${project.progress}%)`);
        });
      }
    }
  };

  const handleProjectSelect = (project: ProductionProject) => {
    setSelectedProject(project);
    setSelectedView('timeline');
    if (import.meta.env.DEV) console.log(`🎯 Proyecto seleccionado: ${project.code}`);
  };

  const handleOperatorSelect = (operator: Operator) => {
    setSelectedOperator(operator);
    setSelectedView('operator');
    if (import.meta.env.DEV) console.log(`👤 Operario seleccionado: ${operator.name} (${operator.role})`);
  };

  const handleValidatePhase = (projectId: string, phaseId: string, notes: string) => {
    const project = projects.find(p => p.id === projectId);
    const operator = selectedOperator;

    if (import.meta.env.DEV) {
      console.log(`🎉 VALIDACIÓN DE FASE: Proyecto=${project?.code}, Operario=${operator?.name}, Notas=${notes}`);
    }

    validatePhase(projectId, phaseId, notes, operator?.id || 'unknown');
  };

  const getAssignedTasks = (operator: Operator) => {
    const tasks: any[] = [];
    projects.forEach(project => {
      project.phases.forEach(projectPhase => {
        if (projectPhase.operatorId === operator.id ||
          (projectPhase.status === 'active' &&
            operator.boxIds.includes(productionPhases.find(p => p.id === projectPhase.phaseId)?.boxId || ''))) {
          const phase = productionPhases.find(p => p.id === projectPhase.phaseId);
          if (phase) {
            tasks.push({ project, phase, projectPhase });
          }
        }
      });
    });
    return tasks;
  };

  // Calcular estadísticas en tiempo real
  const stats = {
    totalProjects: projects.length,
    activeBoxes: boxes.filter(b => b.status === 'active').length,
    activePhasesCount: projects.filter(p => p.currentPhaseId).length,
    averageProgress: Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
  };

  return (
    <Layout
      title="Módulo de Producción"
      subtitle="Gestión completa de la cadena de producción por boxes"
    >
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="sticky top-[var(--header-h)] z-10 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Panel de Control de Producción</h2>

            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedView('boxes')}
                className={`px-4 py-2 rounded-lg transition-colors ${selectedView === 'boxes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Vista Boxes
              </button>

              {userRole !== 'operator' && (
                <select
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    if (project) handleProjectSelect(project);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Ver Timeline de Proyecto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.code} ({project.progress}%)
                    </option>
                  ))}
                </select>
              )}

              <select
                onChange={(e) => {
                  const operator = operators.find(o => o.id === e.target.value);
                  if (operator) handleOperatorSelect(operator);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Panel Operario</option>
                {operators.map(operator => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name} ({operator.role})
                  </option>
                ))}
              </select>

              <button
                onClick={() => window.location.reload()}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Actualizar datos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Summary - Actualizadas en tiempo real */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalProjects}
              </div>
              <div className="text-sm text-blue-600">Proyectos en Producción</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.activeBoxes}
              </div>
              <div className="text-sm text-green-600">Boxes Activos</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats.activePhasesCount}
              </div>
              <div className="text-sm text-orange-600">Fases en Progreso</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.averageProgress}%
              </div>
              <div className="text-sm text-purple-600">Progreso Promedio</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {selectedView === 'boxes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Estaciones de Trabajo</h3>
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                💡 Haz click en cualquier box para ver detalles
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map((box) => (
                <BoxCard
                  key={box.id}
                  box={box}
                  projects={getProjectsByBox(box.id)}
                  onClick={handleBoxClick}
                />
              ))}
            </div>
          </div>
        )}

        {selectedView === 'timeline' && selectedProject && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Timeline de Proyecto</h3>
              <button
                onClick={() => setSelectedView('boxes')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Volver a Boxes
              </button>
            </div>
            <PhaseTimeline
              project={selectedProject}
              phases={productionPhases}
            />
          </div>
        )}

        {selectedView === 'operator' && selectedOperator && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Panel de Operario</h3>
              <button
                onClick={() => setSelectedView('boxes')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Volver a Boxes
              </button>
            </div>
            <OperatorPanel
              operator={selectedOperator}
              assignedTasks={getAssignedTasks(selectedOperator)}
              onValidatePhase={handleValidatePhase}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Produccion;
