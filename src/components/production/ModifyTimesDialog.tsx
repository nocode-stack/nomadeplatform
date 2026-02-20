import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings2, Clock, Calendar } from 'lucide-react';
import { 
  isWeekday, 
  getNextWeekday, 
  addBusinessDays, 
  getBusinessDaysBetween, 
  formatDateForInput,
  getNextWeekdayString
} from '@/utils/businessDays';

interface ModifyTimesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ModifyTimesFormData {
  interval_days: number;
  duration_days: number;
  apply_to: 'update_all' | 'update_from_slot';
  from_slot_code?: string;
  start_date?: string;
}

export const ModifyTimesDialog: React.FC<ModifyTimesDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch existing slots from NEW_Production_Schedule table
  const { data: existingSlots } = useQuery({
    queryKey: ['production-slots-for-modification'],
    queryFn: async () => {
      if (import.meta.env.DEV) console.log('🔍 Fetching production schedule for modification...');
      const { data, error } = await supabase
        .from('NEW_Production_Schedule')
        .select('production_code, id, start_date, end_date')
        .order('production_code', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching production schedule:', error);
        throw error;
      }
      
      if (import.meta.env.DEV) console.log('✅ Production schedule fetched:', data?.length || 0);
      return data || [];
    },
    enabled: open,
  });

  // Calculate current interval and duration from existing data using business days
  const getCurrentSettings = () => {
    if (!existingSlots || existingSlots.length < 2) {
      return {
        interval_days: 2.5,
        duration_days: 50
      };
    }

    // Calculate interval from consecutive slots using business days
    let totalInterval = 0;
    let intervalCount = 0;
    
    for (let i = 1; i < existingSlots.length; i++) {
      const current = existingSlots[i];
      const previous = existingSlots[i - 1];
      
      if (current.start_date && previous.start_date) {
        const currentDate = new Date(current.start_date);
        const previousDate = new Date(previous.start_date);
        
        // Calculate business days between dates instead of calendar days
        const businessDaysDiff = getBusinessDaysBetween(previousDate, currentDate);
        
        if (businessDaysDiff > 0) {
          totalInterval += businessDaysDiff;
          intervalCount++;
        }
      }
    }

    const avgInterval = intervalCount > 0 ? totalInterval / intervalCount : 2.5;
    
    // Use default duration since NEW_Production_Schedule doesn't have estimated_duration_days
    const avgDuration = 50;

    if (import.meta.env.DEV) console.log('📊 Current settings calculated (business days):', { avgInterval, avgDuration });
    
    return {
      interval_days: Math.round(avgInterval * 10) / 10, // Round to 1 decimal
      duration_days: avgDuration
    };
  };

  const form = useForm<ModifyTimesFormData>({
    defaultValues: {
      interval_days: 2.5,
      duration_days: 50,
      apply_to: 'update_all',
      start_date: getNextWeekdayString(), // Default to next weekday
    },
  });

  // Update form values when dialog opens and data is loaded
  useEffect(() => {
    if (open && existingSlots && existingSlots.length > 0) {
      const currentSettings = getCurrentSettings();
      if (import.meta.env.DEV) console.log('🔄 Updating form with current settings:', currentSettings);
      
      form.reset({
        interval_days: currentSettings.interval_days,
        duration_days: currentSettings.duration_days,
        apply_to: 'update_all',
        from_slot_code: undefined,
        start_date: getNextWeekdayString(),
      });
    }
  }, [open, existingSlots, form]);

  // Calculate dates helper using business days
  const calculateDates = (baseDate: string, intervalDays: number, index: number, durationDays: number) => {
    const startDate = new Date(baseDate);
    
    // Ensure base date is a weekday
    const adjustedStartDate = getNextWeekday(startDate);
    
    // Add business days for the interval
    const slotStartDate = index === 0 ? adjustedStartDate : addBusinessDays(adjustedStartDate, intervalDays * index);
    
    // Add business days for duration
    const slotEndDate = addBusinessDays(slotStartDate, durationDays);
    
    return {
      start_date: formatDateForInput(slotStartDate),
      end_date: formatDateForInput(slotEndDate)
    };
  };

  // Update slots mutation - now creates/updates production settings and applies to slots
  const updateSlotsMutation = useMutation({
    mutationFn: async (data: ModifyTimesFormData) => {
      if (import.meta.env.DEV) console.log('🔄 Starting production settings update process...', data);

      // First, create/update the production settings
      const settingsData = {
        days_between_slots: data.interval_days,
        default_slot_duration: data.duration_days,
        is_active: true,
        last_updated_by: 'current_user', // You might want to get the actual user ID here
        applies_from_slot_id: null, // Will be set if updating from specific slot
      };

      // If updating from specific slot, find that slot ID
      if (data.apply_to === 'update_from_slot' && data.from_slot_code) {
        const targetSlot = existingSlots?.find(slot => slot.production_code === data.from_slot_code);
        if (targetSlot) {
          settingsData.applies_from_slot_id = targetSlot.id;
        } else {
          console.error('❌ Target slot not found:', data.from_slot_code);
          throw new Error(`No se encontró el slot ${data.from_slot_code}`);
        }
      }

      // Insert new production settings record (only when applying changes)
      if (import.meta.env.DEV) console.log('🔧 Creating production settings:', settingsData);
      const { error: settingsError } = await supabase
        .from('NEW_Production_Settings')
        .insert(settingsData);

      if (settingsError) {
        console.error('❌ Error creating production settings:', settingsError);
        throw settingsError;
      }

      if (import.meta.env.DEV) console.log('✅ Production settings created successfully');

      // Now apply the settings to existing slots
      let slotsToUpdate = existingSlots || [];
      let baseDate = getNextWeekdayString(); // Default to next weekday
      
      if (data.apply_to === 'update_from_slot' && data.from_slot_code) {
        const fromIndex = slotsToUpdate.findIndex(slot => slot.production_code === data.from_slot_code);
        if (fromIndex >= 0) {
          slotsToUpdate = slotsToUpdate.slice(fromIndex);
          // Use the custom start date if provided, but ensure it's a weekday
          if (data.start_date) {
            const selectedDate = new Date(data.start_date);
            if (!isWeekday(selectedDate)) {
              // Auto-correct to next weekday
              const correctedDate = getNextWeekday(selectedDate);
              baseDate = formatDateForInput(correctedDate);
              if (import.meta.env.DEV) console.log('📅 Auto-corrected weekend date to next weekday:', baseDate);
              
              toast({
                title: "Fecha corregida",
                description: "La fecha seleccionada era fin de semana y se ha ajustado al siguiente día laboral.",
              });
            } else {
              baseDate = data.start_date;
            }
          }
        }
      }
      
      if (import.meta.env.DEV) console.log('📅 Base date (business day):', baseDate);
      if (import.meta.env.DEV) console.log('🔧 Interval:', data.interval_days, 'business days | Duration:', data.duration_days, 'business days');
      if (import.meta.env.DEV) console.log('📊 Slots to update:', slotsToUpdate.length);

      const updates = [];
      
      // Process each slot update individually with proper error handling
      for (let i = 0; i < slotsToUpdate.length; i++) {
        const slot = slotsToUpdate[i];
        const dates = calculateDates(baseDate, data.interval_days, i, data.duration_days);
        
        if (import.meta.env.DEV) console.log(`📝 Updating slot ${slot.production_code}: ${dates.start_date} → ${dates.end_date} (business days only)`);
        
        try {
          const { data: updateResult, error } = await supabase
            .from('NEW_Production_Schedule')
            .update({
              start_date: dates.start_date,
              end_date: dates.end_date,
              updated_at: new Date().toISOString()
            })
            .eq('id', slot.id)
            .select();

          if (error) {
            console.error('❌ Error updating slot:', slot.production_code, error);
            throw error;
          }
          
          if (import.meta.env.DEV) console.log('✅ Slot updated successfully:', slot.production_code, updateResult);
          
          updates.push({
            code: slot.production_code,
            ...dates,
            duration: data.duration_days
          });
        } catch (error) {
          console.error('❌ Failed to update slot:', slot.production_code, error);
          throw error;
        }
      }

      if (import.meta.env.DEV) console.log('🎉 All slots updated successfully (business days):', updates);
      return { count: updates.length, updates };
    },
    onSuccess: (result) => {
      if (import.meta.env.DEV) console.log('🔄 Invalidating queries...');
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['production-slots'] });
      queryClient.invalidateQueries({ queryKey: ['production-slots-for-modification'] });
      
      // Force refetch of the main production slots
      queryClient.refetchQueries({ queryKey: ['production-slots'] });
      
      toast({
        title: "¡Fechas actualizadas correctamente!",
        description: `Se han actualizado ${result.count} slots de producción con fechas de días laborables.`,
      });
      
      onSuccess();
    },
    onError: (error) => {
      console.error('❌ Error in update mutation:', error);
      toast({
        title: "Error al actualizar fechas",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: ModifyTimesFormData) => {
    if (import.meta.env.DEV) console.log('📝 Form submitted with data:', data);

    if (data.apply_to === 'update_from_slot' && !data.from_slot_code) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar un slot inicial",
        variant: "destructive",
      });
      return;
    }

    // Validate start date is a weekday when from_slot is selected
    if (data.apply_to === 'update_from_slot' && data.start_date) {
      const selectedDate = new Date(data.start_date);
      if (!isWeekday(selectedDate)) {
        toast({
          title: "Error de validación",
          description: "La fecha de inicio debe ser un día laboral (lunes a viernes)",
          variant: "destructive",
        });
        return;
      }
    }

    updateSlotsMutation.mutate(data);
  };

  // Get min date for date input (next Monday if today is weekend)
  const getMinDate = () => {
    return getNextWeekdayString();
  };

  // Check if selected date is weekend and show warning
  const selectedDate = form.watch('start_date');
  const isSelectedDateWeekend = selectedDate ? !isWeekday(new Date(selectedDate)) : false;

  const availableSlots = existingSlots?.map(slot => slot.production_code) || [];
  const currentSettings = getCurrentSettings();
  const isFromSlotSelected = form.watch('apply_to') === 'update_from_slot';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Modificar Fechas y Tiempos
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Current Settings Info */}
          {existingSlots && existingSlots.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Configuración Actual</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded px-3 py-2">
                  <p className="text-blue-600 font-medium">Intervalo actual</p>
                  <p className="text-blue-800">{currentSettings.interval_days} días laborables</p>
                </div>
                <div className="bg-white rounded px-3 py-2">
                  <p className="text-blue-600 font-medium">Duración actual</p>
                  <p className="text-blue-800">{currentSettings.duration_days} días laborables</p>
                </div>
              </div>
            </div>
          )}

          {/* Timing Configuration */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3">Nuevos Tiempos</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="interval_days" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Intervalo (días laborables)
                </Label>
                <Input
                  id="interval_days"
                  type="number"
                  step="0.5"
                  min="0.5"
                  {...form.register('interval_days', { valueAsNumber: true })}
                />
                <p className="text-xs text-green-600">
                  Días laborables entre el inicio de cada slot
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_days" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Duración (días laborables)
                </Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  {...form.register('duration_days', { valueAsNumber: true })}
                />
                <p className="text-xs text-green-600">
                  Días laborables de producción por slot
                </p>
              </div>
            </div>
          </div>

          {/* Application Scope */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800 mb-3">Aplicar Cambios</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Aplicar a:</Label>
                <Select
                  value={form.watch('apply_to')}
                  onValueChange={(value: 'update_all' | 'update_from_slot') => 
                    form.setValue('apply_to', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el alcance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update_all">Todos los slots existentes</SelectItem>
                    <SelectItem value="update_from_slot">Desde slot específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isFromSlotSelected && (
                <>
                  <div className="space-y-2">
                    <Label>Desde el slot:</Label>
                    <Select
                      value={form.watch('from_slot_code') || ''}
                      onValueChange={(value) => form.setValue('from_slot_code', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el slot inicial" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slotCode) => (
                          <SelectItem key={slotCode} value={slotCode}>
                            {slotCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de inicio (solo días laborables)
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      min={getMinDate()}
                      {...form.register('start_date')}
                      className={isSelectedDateWeekend ? 'border-red-300 bg-red-50' : ''}
                    />
                    {isSelectedDateWeekend && (
                      <p className="text-xs text-red-600">
                        ⚠️ Esta fecha es fin de semana. Se ajustará automáticamente al siguiente día laboral.
                      </p>
                    )}
                    <p className="text-xs text-orange-600">
                      Los siguientes slots se calcularán desde esta fecha (solo días laborables)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateSlotsMutation.isPending}
            >
              {updateSlotsMutation.isPending 
                ? 'Actualizando...' 
                : 'Actualizar Fechas'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
