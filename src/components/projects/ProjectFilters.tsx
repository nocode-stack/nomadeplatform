
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '../ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown
} from 'lucide-react';
import { ProjectFilter } from '../../types/projects';

interface ProjectFiltersProps {
  filters: ProjectFilter;
  onFiltersChange: (filters: ProjectFilter) => void;
  activeFiltersCount: number;
}

const ProjectFilters = ({ filters, onFiltersChange, activeFiltersCount }: ProjectFiltersProps) => {
  const typeOptions = [
    { value: 'prospect', label: 'Prospects' },
    { value: 'client', label: 'Proyectos' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Borrador' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'pre_production', label: 'Pre-producción' },
    { value: 'in_production', label: 'En Producción' },
    { value: 'quality_control', label: 'Control Calidad' },
    { value: 'packaging', label: 'Embalaje' },
    { value: 'delivery', label: 'Entrega' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'on_hold', label: 'En Pausa' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' }
  ];

  const handleTypeToggle = (type: string) => {
    const currentType = filters.type || [];
    const newType = currentType.includes(type as any)
      ? currentType.filter(t => t !== type)
      : [...currentType, type as any];
    
    onFiltersChange({
      ...filters,
      type: newType.length > 0 ? newType : undefined
    });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status as any)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status as any];
    
    onFiltersChange({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined
    });
  };

  const handlePriorityToggle = (priority: string) => {
    const currentPriority = filters.priority || [];
    const newPriority = currentPriority.includes(priority as any)
      ? currentPriority.filter(p => p !== priority)
      : [...currentPriority, priority as any];
    
    onFiltersChange({
      ...filters,
      priority: newPriority.length > 0 ? newPriority : undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getSelectedTypeText = () => {
    const count = filters.type?.length || 0;
    if (count === 0) return 'Todos los tipos';
    if (count === 1) return typeOptions.find(t => t.value === filters.type?.[0])?.label || 'Tipo';
    return `${count} tipos seleccionados`;
  };

  const getSelectedStatusText = () => {
    const count = filters.status?.length || 0;
    if (count === 0) return 'Todos los estados';
    if (count === 1) return statusOptions.find(s => s.value === filters.status?.[0])?.label || 'Estado';
    return `${count} estados seleccionados`;
  };

  const getSelectedPriorityText = () => {
    const count = filters.priority?.length || 0;
    if (count === 0) return 'Todas las prioridades';
    if (count === 1) return priorityOptions.find(p => p.value === filters.priority?.[0])?.label || 'Prioridad';
    return `${count} prioridades seleccionadas`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar proyectos..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
              className="pl-10"
            />
          </div>

          {/* Dropdown Tipo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[150px] justify-between">
                {getSelectedTypeText()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Tipo de Registro</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {typeOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.type?.includes(option.value as any) || false}
                  onCheckedChange={() => handleTypeToggle(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown Estados */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[150px] justify-between">
                {getSelectedStatusText()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Estados del Proyecto</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.status?.includes(option.value as any) || false}
                  onCheckedChange={() => handleStatusToggle(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown Prioridades */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[150px] justify-between">
                {getSelectedPriorityText()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Prioridades</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {priorityOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.priority?.includes(option.value as any) || false}
                  onCheckedChange={() => handlePriorityToggle(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFilters;
