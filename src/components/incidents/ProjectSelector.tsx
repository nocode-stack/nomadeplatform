
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useUnifiedProjectsList } from '../../hooks/useUnifiedProjects';
import { Loader2 } from 'lucide-react';

interface ProjectSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
}

const ProjectSelector = ({ value, onValueChange, error }: ProjectSelectorProps) => {
  const { data: projects = [], isLoading } = useUnifiedProjectsList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Cargando proyectos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Proyecto <span className="text-red-500">*</span>
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Selecciona un proyecto" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.code} - {project.new_clients?.name || 'Sin cliente'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default ProjectSelector;
