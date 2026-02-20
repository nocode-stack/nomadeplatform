
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader2, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';

interface ProjectCodeSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  isProspect?: boolean;
}

interface ProductionSlot {
  id: string;
  production_code: string;
  start_date: string;
  end_date: string;
  project_id?: string;
}

const ProjectCodeSelector = ({ value, onValueChange, disabled, allowEmpty = false, isProspect = false }: ProjectCodeSelectorProps) => {
  // Nueva prop para incluir el slot actualmente asignado
  const currentSlotId = value;

  const { data: availableSlots, isLoading, error } = useQuery({
    queryKey: ['available-production-slots', currentSlotId],
    queryFn: async (): Promise<ProductionSlot[]> => {
      if (import.meta.env.DEV) console.log('🔍 Fetching available production slots...');
      if (import.meta.env.DEV) console.log('📋 Current slot ID:', currentSlotId);
      
      let slotsData: ProductionSlot[] = [];
      
      // Primero, obtener todos los slots disponibles (sin project_id)
      const { data: availableSlots, error: availableError } = await supabase
        .from('NEW_Production_Schedule')
        .select('id, production_code, start_date, end_date, project_id')
        .is('project_id', null)
        .order('production_code');

      if (availableError) {
        console.error('❌ Error fetching available slots:', availableError);
        throw availableError;
      }

      slotsData = availableSlots || [];

      // Si hay un slot actual asignado, obtenerlo por separado
      if (currentSlotId) {
        const { data: currentSlot, error: currentError } = await supabase
          .from('NEW_Production_Schedule')
          .select('id, production_code, start_date, end_date, project_id')
          .eq('id', currentSlotId)
          .maybeSingle();

        if (currentError) {
          console.error('❌ Error fetching current slot:', currentError);
        } else if (currentSlot) {
          if (import.meta.env.DEV) console.log('✅ Current slot found:', currentSlot.production_code);
          // Solo agregar si no está ya en la lista
          if (!slotsData.find(slot => slot.id === currentSlot.id)) {
            slotsData.push(currentSlot);
          }
        }
      }

      // Ordenar por production_code
      slotsData.sort((a, b) => a.production_code.localeCompare(b.production_code));

      if (import.meta.env.DEV) console.log('✅ Total production slots fetched:', slotsData.length);
      if (import.meta.env.DEV) console.log('📊 Slots data:', slotsData);
      return slotsData;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const selectedSlot = value ? availableSlots?.find(slot => slot.id === value) : null;
  const isUnassigned = !value;

  const clearSelection = () => {
    onValueChange('');
  };

  // Función simplificada para manejar el cambio de valor - solo actualiza el estado del formulario
  const handleValueChange = (newValue: string) => {
    if (import.meta.env.DEV) console.log('🔄 ProjectCodeSelector - Handling value change:', newValue);
    
    // Convertir 'no-assignment' a cadena vacía para React Hook Form
    const finalValue = newValue === 'no-assignment' ? '' : newValue;
    onValueChange(finalValue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600">Cargando códigos disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 border rounded-md bg-red-50 text-red-600 text-sm">
        Error al cargar los códigos de proyecto
      </div>
    );
  }

  // Si es un prospecto, mostrar mensaje específico
  if (isProspect) {
    return (
      <div className="space-y-2">
        <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
          <div className="text-sm text-yellow-700 font-medium">⚠️ Prospecto</div>
          <div className="text-xs text-yellow-600 mt-1">
            Los prospectos no pueden tener códigos de producción asignados. Convierte al cliente para habilitar esta funcionalidad.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Select value={value || 'no-assignment'} onValueChange={handleValueChange} disabled={disabled}>
            <SelectTrigger className={isUnassigned ? "text-gray-500" : ""}>
              <SelectValue placeholder="Selecciona un código de proyecto (opcional)">
                {selectedSlot ? (
                  <span className="font-medium text-gray-900">{selectedSlot.production_code}</span>
                ) : (
                  <span className="text-gray-500 italic">Sin código de producción asignado</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {allowEmpty && (
                <SelectItem value="no-assignment" className="cursor-pointer">
                  <div className="flex flex-col space-y-1 py-1 w-full">
                    <div className="text-sm text-gray-600 italic">Sin asignar código de producción</div>
                    <div className="text-xs text-gray-500">Perfecto para proyectos en fase de prospect</div>
                  </div>
                </SelectItem>
              )}
              
              {availableSlots && availableSlots.length > 0 ? (
                availableSlots.map((slot) => {
                  const isCurrentSlot = slot.id === currentSlotId;
                  const isAvailable = !slot.project_id || isCurrentSlot;
                  
                  return (
                    <SelectItem 
                      key={slot.id} 
                      value={slot.id} 
                      className={`cursor-pointer ${!isAvailable ? 'opacity-50' : ''}`}
                      disabled={!isAvailable}
                    >
                      <div className="flex flex-col space-y-1 py-1 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {slot.production_code}
                            {isCurrentSlot && <span className="text-green-600 ml-2">(Actual)</span>}
                            {!isAvailable && !isCurrentSlot && <span className="text-red-600 ml-2">(Ocupado)</span>}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Inicio: {formatDate(slot.start_date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Fin: {formatDate(slot.end_date)}</span>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="no-codes-available" disabled className="cursor-not-allowed">
                  <div className="text-sm text-gray-500 italic">No hay códigos disponibles</div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {allowEmpty && value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSelection}
            disabled={disabled}
            className="px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isUnassigned ? (
        <div className="text-xs text-gray-500 mt-1 bg-blue-50 p-2 rounded border-l-4 border-blue-200">
          ℹ️ <strong>Proyecto sin código de producción:</strong> Las fechas de producción y entrega se calcularán cuando asignes un código
        </div>
      ) : (
        <div className="text-xs text-green-700 mt-1 bg-green-50 p-2 rounded border-l-4 border-green-200">
          ✅ <strong>Código asignado:</strong> El proyecto entrará automáticamente en planificación de producción
        </div>
      )}
    </div>
  );
};

export default ProjectCodeSelector;
