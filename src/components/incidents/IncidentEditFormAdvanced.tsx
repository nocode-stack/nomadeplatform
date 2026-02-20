import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit2 } from 'lucide-react';
import { NewIncident } from '../../hooks/useNewIncidents';
import { useUpdateIncident } from '../../hooks/useIncidentEdit';
import { useIncidentPhotos } from '../../hooks/useIncidentPhotos';
import { useIncidentItems } from '../../hooks/useIncidentItems';
import PhotoUpload from './PhotoUpload';
import IncidentItemsManager from './IncidentItemsManager';

interface IncidentEditFormAdvancedProps {
  incident: NewIncident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IncidentEditFormAdvanced = ({ incident, open, onOpenChange }: IncidentEditFormAdvancedProps) => {
  const updateIncident = useUpdateIncident();
  const { uploadMultiplePhotos } = useIncidentPhotos();
  const { data: existingItems = [] } = useIncidentItems(incident.id);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>(incident.photos || []);
  const [incidentItems, setIncidentItems] = useState<Array<{
    description: string;
    category: string;
    priority: string;
  }>>([]);
  const [formData, setFormData] = useState({
    incident_date: incident.incident_date,
    workshop: incident.workshop,
    comments: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const workshops = [
    'Nomade',
    'Caravaning Plaza',
    'Planeta Camper',
    'Al Milimetro'
  ];

  // Load existing data when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        incident_date: incident.incident_date,
        workshop: incident.workshop,
        comments: '',
      });
      setCurrentPhotos(incident.photos || []);
      
      // Convert existing items to the format expected by IncidentItemsManager
      const convertedItems = existingItems.map(item => ({
        description: item.description,
        category: item.category,
        priority: item.priority || 'medium'
      }));
      setIncidentItems(convertedItems);
    }
  }, [open, incident, existingItems]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when a value is selected
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.workshop) {
      newErrors.workshop = 'El taller es obligatorio';
    }
    if (incidentItems.length === 0) {
      newErrors.items = 'Debes agregar al menos un concepto de reparación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Upload new photos if any
      let newPhotoUrls: string[] = [];
      if (selectedFiles.length > 0) {
        newPhotoUrls = await uploadMultiplePhotos(selectedFiles, incident.id);
      }

      // Combine existing and new photos
      const allPhotos = [...currentPhotos, ...newPhotoUrls];

      // Create the description based on current concepts
      const description = incidentItems.length > 0 
        ? `Incidencia reportada con ${incidentItems.length} concepto(s): ${incidentItems.map(item => item.description).join(', ')}`
        : 'Incidencia reportada';

      // Update the main incident
      await updateIncident.mutateAsync({
        incidentId: incident.id,
        data: {
          incident_date: formData.incident_date,
          description: description,
          workshop: formData.workshop,
          photos: allPhotos,
        }
      });

      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  const handlePhotosUpdated = (newPhotos: string[]) => {
    setCurrentPhotos(newPhotos);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit2 className="h-5 w-5 text-blue-500" />
            <span>Editar Incidencia - {incident.reference_number}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Información del Proyecto</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Proyecto:</span>
                <span className="ml-2">{incident.project?.project_code || 'Sin código'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Cliente:</span>
                <span className="ml-2">{incident.project?.client?.name || incident.project?.client_name || 'Sin cliente'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Nombre:</span>
                <span className="ml-2">{incident.project?.name || 'Sin nombre'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Referencia:</span>
                <span className="ml-2">{incident.reference_number || 'Sin referencia'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="incident_date">Fecha de la Incidencia <span className="text-red-500">*</span></Label>
              <Input
                id="incident_date"
                type="date"
                value={formData.incident_date}
                onChange={(e) => handleInputChange('incident_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workshop">Taller Asignado <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.workshop} 
                onValueChange={(value) => handleInputChange('workshop', value)}
              >
                <SelectTrigger className={errors.workshop ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecciona un taller" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop} value={workshop}>
                      {workshop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.workshop && (
                <p className="text-sm text-red-600">{errors.workshop}</p>
              )}
            </div>
          </div>

          {/* Incident items/concepts manager */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Conceptos de Reparación <span className="text-red-500">*</span></Label>
              <p className="text-sm text-gray-600">Edita los conceptos específicos que necesitan reparación</p>
            </div>
            <IncidentItemsManager
              incidentId={incident.id}
              items={incidentItems}
              onItemsChange={(items) => {
                setIncidentItems(items);
                // Clear error when concepts are added
                if (errors.items && items.length > 0) {
                  setErrors(prev => ({ ...prev, items: '' }));
                }
              }}
              isEditing={true}
            />
            {errors.items && (
              <p className="text-sm text-red-600">{errors.items}</p>
            )}
          </div>

          {/* Photo management */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Fotos de la Incidencia</Label>
              <p className="text-sm text-gray-600">Gestiona las fotos de la incidencia</p>
            </div>
            <PhotoUpload
              incidentId={incident.id}
              existingPhotos={currentPhotos}
              onPhotosUploaded={handlePhotosUpdated}
              files={selectedFiles}
              onFilesChange={setSelectedFiles}
            />
          </div>

          {/* Comments field */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comentarios Adicionales</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              placeholder="Agrega comentarios adicionales sobre la incidencia..."
              rows={3}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateIncident.isPending || incidentItems.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateIncident.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentEditFormAdvanced;