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

interface ProductionSlotSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  currentProjectId?: string; // Para mostrar el slot actual del proyecto
}

interface ProductionSlot {
  id: string;
  production_code: string;
  start_date: string;
  end_date: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

const ProductionSlotSelector = ({ value, onValueChange, disabled, allowEmpty = false, currentProjectId }: ProductionSlotSelectorProps) => {
  const { data: availableSlots, isLoading, error } = useQuery({
    queryKey: ['available-production-slots', currentProjectId],
    queryFn: async (): Promise<ProductionSlot[]> => {
      if (import.meta.env.DEV) console.log('🔍 Fetching available production slots...');
      
      // Obtener slots disponibles + slot actual del proyecto si existe
      const { data, error } = await supabase
        .from('NEW_Production_Schedule')
        .select('*')
        .or(`project_id.is.null,project_id.eq.${currentProjectId || 'null'}`)
        .order('production_code');

      if (error) {
        console.error('❌ Error fetching production slots:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Available production slots fetched:', data?.length || 0);
      return data || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateString: string) => {
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

  const handleValueChange = (newValue: string) => {
    if (import.meta.env.DEV) console.log('🔄 ProductionSlotSelector - Handling value change:', newValue);
    
    // Convert 'no-assignment' to empty string for form handling
    const finalValue = newValue === 'no-assignment' ? '' : newValue;
    onValueChange(finalValue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600">Cargando códigos de producción disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 border rounded-md bg-red-50 text-red-600 text-sm">
        Error al cargar los códigos de producción
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Select value={value || 'no-assignment'} onValueChange={handleValueChange} disabled={disabled}>
            <SelectTrigger className={isUnassigned ? "text-gray-500" : ""}>
              <SelectValue placeholder="Selecciona un código de producción (opcional)">
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
                  const isCurrentSlot = slot.project_id === currentProjectId;
                  const isAvailable = slot.project_id === null;
                  
                  return (
                    <SelectItem key={slot.id} value={slot.id} className="cursor-pointer">
                      <div className="flex flex-col space-y-1 py-1 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{slot.production_code}</span>
                          <span className={`text-xs ${isCurrentSlot ? 'text-blue-600 font-medium' : isAvailable ? 'text-green-600' : 'text-orange-600'}`}>
                            {isCurrentSlot ? 'Asignado actual' : isAvailable ? 'Disponible' : 'Ocupado'}
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
                <SelectItem value="no-slots-available" disabled className="cursor-not-allowed">
                  <div className="text-sm text-gray-500 italic">No hay códigos de producción disponibles</div>
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
          ℹ️ <strong>Proyecto sin código de producción:</strong> Las fechas de producción se asignarán cuando selecciones un código
        </div>
      ) : (
        <div className="text-xs text-green-700 mt-1 bg-green-50 p-2 rounded border-l-4 border-green-200">
          ✅ <strong>Código asignado:</strong> El proyecto entrará automáticamente en planificación de producción
        </div>
      )}
    </div>
  );
};

export default ProductionSlotSelector;