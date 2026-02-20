import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit2 } from 'lucide-react';
import { NewIncident } from '../../hooks/useNewIncidents';
import { useToast } from '../../hooks/use-toast';

interface NewIncidentEditDialogProps {
  incident: NewIncident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewIncidentEditDialog = ({ incident, open, onOpenChange }: NewIncidentEditDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    incident_date: incident.incident_date,
    description: incident.description,
    workshop: incident.workshop,
    category: incident.category,
  });

  const workshops = [
    'Nomade',
    'Caravaning Plaza', 
    'Planeta Camper',
    'Al Milimetro'
  ];

  const categories = [
    'Mobiliario',
    'Sistema eléctrico',
    'Agua',
    'Gas',
    'Revestimiento',
    'Vehículo',
    'Filtraciones'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Here you would typically update the incident
      // For now, we'll just show a toast as placeholder
      toast({
        title: "Funcionalidad en desarrollo",
        description: "La edición de incidencias estará disponible próximamente.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating incident:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al actualizar la incidencia.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit2 className="h-5 w-5 text-blue-500" />
            <span>Editar Incidencia</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incident_date">Fecha de la Incidencia</Label>
              <Input
                id="incident_date"
                type="date"
                value={formData.incident_date}
                onChange={(e) => handleInputChange('incident_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workshop">Taller Asignado</Label>
              <Select 
                value={formData.workshop} 
                onValueChange={(value) => handleInputChange('workshop', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop} value={workshop}>
                      {workshop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewIncidentEditDialog;