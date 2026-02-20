
import React, { useState } from 'react';
import { ProductionProject, ProjectPhase, ProductionPhase, Operator } from '../../types/production';
import { CheckCircle, Clock, MessageSquare, Camera } from 'lucide-react';

interface OperatorPanelProps {
  operator: Operator;
  assignedTasks: {
    project: ProductionProject;
    phase: ProductionPhase;
    projectPhase: ProjectPhase;
  }[];
  onValidatePhase: (projectId: string, phaseId: string, notes: string) => void;
}

const OperatorPanel = ({ operator, assignedTasks, onValidatePhase }: OperatorPanelProps) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async (projectId: string, phaseId: string) => {
    if (!notes.trim()) {
      alert('Por favor, añade notas sobre el trabajo realizado');
      return;
    }

    setIsValidating(true);
    
    try {
      onValidatePhase(projectId, phaseId, notes);
      
      // Mostrar confirmación
      alert('✅ Fase validada correctamente. El proyecto avanza automáticamente.');
      
      setNotes('');
      setSelectedTask(null);
    } catch (error) {
      console.error('Error al validar fase:', error);
      alert('❌ Error al validar la fase. Inténtalo de nuevo.');
    } finally {
      setIsValidating(false);
    }
  };

  const activeTasks = assignedTasks.filter(task => task.projectPhase.status === 'active');
  const completedTasks = assignedTasks.filter(task => task.projectPhase.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Panel de Operario - {operator.name}
        </h2>
        <p className="text-blue-700">
          Boxes asignados: {operator.boxIds.join(', ')} | Rol: {operator.role}
        </p>
      </div>

      {/* Tareas Activas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 text-orange-500 mr-2" />
          Tareas Activas ({activeTasks.length})
        </h3>

        {activeTasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No tienes tareas activas asignadas</p>
            <p className="text-gray-400 text-sm mt-2">Las nuevas tareas aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTasks.map((task) => (
              <div key={`${task.project.id}-${task.phase.id}`} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {task.project.code}
                    </h4>
                    <p className="text-sm text-gray-600">{task.phase.name}</p>
                    <p className="text-xs text-gray-500">Cliente: {task.project.client}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      En progreso
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Progreso: {task.project.progress}%
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{task.phase.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <div>Tiempo estimado: {task.phase.estimatedDays} días</div>
                    {task.projectPhase.actualStartDate && (
                      <div className="text-xs text-green-600 mt-1">
                        Iniciada: {new Date(task.projectPhase.actualStartDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTask(`${task.project.id}-${task.phase.id}`)}
                    disabled={isValidating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marcar como Completada</span>
                  </button>
                </div>

                {selectedTask === `${task.project.id}-${task.phase.id}` && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-300">
                    <h5 className="font-medium text-gray-900 mb-3">✅ Validar Fase Completada</h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas y observaciones *
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Describe el trabajo realizado, observaciones, problemas encontrados..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <Camera className="w-4 h-4" />
                          <span>Adjuntar Fotos</span>
                        </button>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={() => handleValidate(task.project.id, task.phase.id)}
                          disabled={isValidating || !notes.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isValidating ? 'Validando...' : 'Confirmar Validación'}
                        </button>
                        <button
                          onClick={() => setSelectedTask(null)}
                          disabled={isValidating}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tareas Completadas Recientes */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            Tareas Completadas Recientes ({completedTasks.length})
          </h3>

          <div className="space-y-3">
            {completedTasks.slice(0, 5).map((task) => (
              <div key={`${task.project.id}-${task.phase.id}`} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {task.project.code} - {task.phase.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Completada: {task.projectPhase.actualEndDate ? new Date(task.projectPhase.actualEndDate).toLocaleDateString() : 'Hoy'}
                  </p>
                  {task.projectPhase.operatorNotes && (
                    <p className="text-xs text-gray-500 mt-1">
                      "{task.projectPhase.operatorNotes}"
                    </p>
                  )}
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 ml-4" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorPanel;
