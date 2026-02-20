import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Calendar, Edit } from 'lucide-react';

interface ProductionSlot {
  id: string;
  production_code: string;
  start_date: string | null;
  end_date: string | null;
  project_id: string | null;
  status?: 'available' | 'assigned' | 'completed' | 'cancelled';
}

interface EditProductionSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: ProductionSlot | null;
  onSuccess: () => void;
}

interface FormData {
  production_code: string;
  start_date: string;
  end_date: string;
}

export const EditProductionSlotDialog: React.FC<EditProductionSlotDialogProps> = ({
  open,
  onOpenChange,
  slot,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    defaultValues: {
      production_code: '',
      start_date: '',
      end_date: '',
    },
  });

  // Cargar datos del slot cuando se abre el diálogo
  useEffect(() => {
    if (slot && open) {
      form.reset({
        production_code: slot.production_code,
        start_date: slot.start_date || '',
        end_date: slot.end_date || '',
      });
    }
  }, [slot, open, form]);

  const updateSlotMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!slot) throw new Error('No slot selected');
      
      if (import.meta.env.DEV) console.log('🔄 Updating production slot...', slot.id, data);

      const { error } = await supabase
        .from('NEW_Production_Schedule')
        .update({
          production_code: data.production_code,
          start_date: data.start_date,
          end_date: data.end_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slot.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-slots'] });
      queryClient.invalidateQueries({ queryKey: ['production-slots-for-modification'] });
      toast({
        title: "¡Slot actualizado!",
        description: "El slot de producción se ha actualizado correctamente.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('❌ Error updating production slot:', error);
      toast({
        title: "Error al actualizar slot",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: FormData) => {
    if (!data.production_code.trim()) {
      toast({
        title: "Error de validación",
        description: "El código es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!data.start_date) {
      toast({
        title: "Error de validación",
        description: "La fecha de entrada a producción es requerida",
        variant: "destructive",
      });
      return;
    }

    if (!data.end_date) {
      toast({
        title: "Error de validación",
        description: "La fecha de finalización es requerida",
        variant: "destructive",
      });
      return;
    }

    updateSlotMutation.mutate(data);
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Slot de Producción
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="production_code">Código de Producción</Label>
            <Input
              id="production_code"
              placeholder="Ej: N2575"
              {...form.register('production_code', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input
              id="start_date"
              type="date"
              {...form.register('start_date', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Fecha de Finalización</Label>
            <Input
              id="end_date"
              type="date"
              {...form.register('end_date', { required: true })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateSlotMutation.isPending}
            >
              {updateSlotMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};