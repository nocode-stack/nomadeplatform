
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { CreateIncidentData } from '@/hooks/useIncidents';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface IncidentFormProps {
  projectId: string;
  onIncidentCreated: (incident: CreateIncidentData) => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ projectId, onIncidentCreated }) => {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateIncidentData>({
    defaultValues: {
      project_id: projectId,
      incident_date: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = (data: CreateIncidentData) => {
    logger.incident.create({ ...data, project_id: projectId });
    onIncidentCreated({ ...data, project_id: projectId });
    toast({
      title: "Incidencia creada",
      description: "La incidencia ha sido creada correctamente.",
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Incidencia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nueva Incidencia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="incident_date">Fecha de la Incidencia *</Label>
            <Input
              id="incident_date"
              type="date"
              {...register('incident_date', { required: 'La fecha es obligatoria' })}
            />
            {errors.incident_date && (
              <p className="text-sm text-red-600">{errors.incident_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workshop">Taller *</Label>
            <Select onValueChange={(value) => setValue('workshop', value as CreateIncidentData['workshop'])}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el taller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nomade">Nomade</SelectItem>
                <SelectItem value="Caravaning Plaza">Caravaning Plaza</SelectItem>
                <SelectItem value="Planeta Camper">Planeta Camper</SelectItem>
                <SelectItem value="Al Milimetro">Al Milimetro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción Detallada *</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'La descripción es obligatoria' })}
              placeholder="Describe la incidencia con el mayor detalle posible..."
              rows={5}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Crear Incidencia
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentForm;
