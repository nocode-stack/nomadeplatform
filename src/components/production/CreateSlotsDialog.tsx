
import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';

interface CreateSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreateSlotsFormData {
  count: number;
  prefix: string;
  year: string;
}

export const CreateSlotsDialog: React.FC<CreateSlotsDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch existing slots to calculate next consecutive number and get last slot format
  const { data: existingSlots } = useQuery({
    queryKey: ['production-slots-for-numbering'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Production_Schedule')
        .select('production_code, id, start_date, end_date')
        .order('production_code', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const form = useForm<CreateSlotsFormData>({
    defaultValues: {
      count: 5,
      prefix: 'N',
      year: '25',
    },
  });

  // Calculate next consecutive number based on existing slots
  const getNextConsecutiveNumber = (prefix: string, year: string) => {
    if (!existingSlots) return 1;
    
    const pattern = new RegExp(`^${prefix}${year}(\\d+)$`);
    const numbers = existingSlots
      .map(slot => {
        const match = slot.production_code.match(pattern);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  };

  // Get format from last available slot
  const getLastSlotFormat = () => {
    if (!existingSlots || existingSlots.length === 0) {
      return {
        interval_days: 2.5,
        duration_days: 50
      };
    }

    // Calculate interval from the difference between consecutive slots if possible
    let interval_days = 2.5; // default
    if (existingSlots.length >= 2) {
      const lastTwoSlots = existingSlots.slice(-2);
      if (lastTwoSlots[0].start_date && lastTwoSlots[1].start_date) {
        const date1 = new Date(lastTwoSlots[0].start_date);
        const date2 = new Date(lastTwoSlots[1].start_date);
        interval_days = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
      }
    }

    return {
      interval_days,
      duration_days: 50 // Default duration since NEW_Production_Schedule doesn't have estimated_duration_days
    };
  };

  // Calculate dates helper using last slot format
  const calculateDates = (startDate: string, intervalDays: number, index: number, durationDays: number) => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + (intervalDays * index));
    
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);
    
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    };
  };

  // Create slots mutation
  const createSlotsMutation = useMutation({
    mutationFn: async (data: CreateSlotsFormData) => {
      if (import.meta.env.DEV) console.log('🔄 Creating new slots...', data);

      const startingNumber = getNextConsecutiveNumber(data.prefix, data.year);
      const startDate = new Date().toISOString().split('T')[0];
      const format = getLastSlotFormat();

      const slots = [];
      for (let i = 0; i < data.count; i++) {
        const slotNumber = startingNumber + i;
        const production_code = `${data.prefix}${data.year}${slotNumber.toString().padStart(2, '0')}`;
        const dates = calculateDates(startDate, format.interval_days, i, format.duration_days);
        
        slots.push({
          production_code,
          project_id: null, // No project assigned initially
          start_date: dates.start_date,
          end_date: dates.end_date,
        });
      }

      const { error } = await supabase
        .from('NEW_Production_Schedule')
        .insert(slots);

      if (error) throw error;
      return { count: slots.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['production-slots'] });
      queryClient.invalidateQueries({ queryKey: ['production-slots-for-numbering'] });
      
      toast({
        title: "¡Slots creados correctamente!",
        description: `Se han creado ${result.count} nuevos slots de producción.`,
      });
      
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('❌ Error creating slots:', error);
      toast({
        title: "Error al crear slots",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });

  // Generate preview
  const generatePreview = () => {
    const formData = form.getValues();
    if (!formData.prefix || !formData.year) return [];

    const startingNumber = getNextConsecutiveNumber(formData.prefix, formData.year);
    const startDate = new Date().toISOString().split('T')[0];
    const format = getLastSlotFormat();
    const preview = [];
    
    for (let i = 0; i < Math.min(formData.count, 5); i++) {
      const slotNumber = startingNumber + i;
      const code = `${formData.prefix}${formData.year}${slotNumber.toString().padStart(2, '0')}`;
      const dates = calculateDates(startDate, format.interval_days, i, format.duration_days);
      preview.push({ code, ...dates });
    }
    return preview;
  };

  const handleSubmit = (data: CreateSlotsFormData) => {
    if (import.meta.env.DEV) console.log('📝 Form submitted:', data);
    
    if (!data.prefix.trim() || !data.year.trim()) {
      toast({
        title: "Error de validación",
        description: "El prefijo y año son requeridos",
        variant: "destructive",
      });
      return;
    }

    if (data.count < 1 || data.count > 100) {
      toast({
        title: "Error de validación",
        description: "La cantidad debe estar entre 1 y 100",
        variant: "destructive",
      });
      return;
    }

    createSlotsMutation.mutate(data);
  };

  const preview = generatePreview();
  const format = getLastSlotFormat();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Nuevos Slots
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Configuración de Códigos</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefijo</Label>
                <Input
                  id="prefix"
                  placeholder="N"
                  {...form.register('prefix', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input
                  id="year"
                  placeholder="25"
                  {...form.register('year', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Cantidad</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  {...form.register('count', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3">Formato Aplicado</h3>
            <p className="text-sm text-green-700 mb-2">
              Se utilizará el formato del último slot disponible:
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Intervalo:</span>
                <Badge variant="outline" className="font-mono">
                  {format.interval_days} días
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Duración:</span>
                <Badge variant="outline" className="font-mono">
                  {format.duration_days} días
                </Badge>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Puedes modificar estos valores después usando "Modificar Fechas"
            </p>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 mb-2">Vista Previa de Nuevos Slots:</h4>
              <div className="space-y-1">
                {preview.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="font-mono">
                      {slot.code}
                    </Badge>
                    <span className="text-gray-600">
                      {slot.start_date} → {slot.end_date}
                    </span>
                  </div>
                ))}
                {form.watch('count') > 5 && (
                  <p className="text-xs text-gray-600 pt-1">
                    ... y {form.watch('count') - 5} slots más
                  </p>
                )}
              </div>
            </div>
          )}

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
              disabled={createSlotsMutation.isPending}
            >
              {createSlotsMutation.isPending 
                ? 'Creando...' 
                : `Crear ${form.watch('count')} Slots`
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
