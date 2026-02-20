
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useCreateNewIncident } from '../../hooks/useNewIncidents';
import { useIncidentPhotos } from '../../hooks/useIncidentPhotos';
import { useProjectsList } from '../../hooks/useNewProjects';
import PhotoUpload from './PhotoUpload';
import IncidentItemsManager from './IncidentItemsManager';
import ProjectSelector from './ProjectSelector';

interface IncidentFormDialogProps {
  preselectedProjectId?: string;
}

const IncidentFormDialog = ({ preselectedProjectId }: IncidentFormDialogProps) => {
  const { id: urlProjectId } = useParams();
  const projectId = preselectedProjectId || urlProjectId;
  const { data: projects } = useProjectsList();
  const project = projects?.find(p => p.id === (projectId || ''));
  const createIncident = useCreateNewIncident();
  const { uploadMultiplePhotos } = useIncidentPhotos();
  
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [incidentItems, setIncidentItems] = useState<Array<{
    description: string;
    category: string;
    priority: string;
  }>>([]);
  const [formData, setFormData] = useState({
    project_id: projectId || '',
    incident_date: new Date().toISOString().split('T')[0],
    workshop: '' as 'Nomade' | 'Caravaning Plaza' | 'Planeta Camper' | 'Al Milimetro' | '',
    comments: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const workshops = [
    'Nomade',
    'Caravaning Plaza',
    'Planeta Camper',
    'Al Milimetro'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando se selecciona un valor
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_id) {
      newErrors.project_id = 'El proyecto es obligatorio';
    }
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
      // Crear un ID temporal para las fotos
      const tempIncidentId = `temp-${Date.now()}`;
      
      // Subir fotos si hay alguna
      let photoUrls: string[] = [];
      if (selectedFiles.length > 0) {
        photoUrls = await uploadMultiplePhotos(selectedFiles, tempIncidentId);
      }

      // Crear la descripción general basada en los conceptos agregados
      const description = incidentItems.length > 0 
        ? `Incidencia reportada con ${incidentItems.length} concepto(s): ${incidentItems.map(item => item.description).join(', ')}`
        : 'Incidencia reportada';

      // Crear la incidencia principal
      await createIncident.mutateAsync({
        project_id: formData.project_id,
        incident_date: formData.incident_date,
        description: description,
        workshop: formData.workshop as 'Nomade' | 'Caravaning Plaza' | 'Planeta Camper' | 'Al Milimetro',
        photos: photoUrls,
        items: incidentItems,
        comments: formData.comments,
      });

      // Reset form
      setFormData({
        project_id: projectId || '',
        incident_date: new Date().toISOString().split('T')[0],
        workshop: '' as 'Nomade' | 'Caravaning Plaza' | 'Planeta Camper' | 'Al Milimetro' | '',
        comments: '',
      });
      setSelectedFiles([]);
      setIncidentItems([]);
      setErrors({});
      setOpen(false);
      
    } catch (error) {
      console.error('Error creating incident:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: projectId || '',
      incident_date: new Date().toISOString().split('T')[0],
      workshop: '' as 'Nomade' | 'Caravaning Plaza' | 'Planeta Camper' | 'Al Milimetro' | '',
      comments: '',
    });
    setSelectedFiles([]);
    setIncidentItems([]);
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Reportar Incidencia</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Reportar Nueva Incidencia</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de proyecto - solo aparece si no hay proyecto preseleccionado */}
          {!projectId && (
            <ProjectSelector
              value={formData.project_id}
              onValueChange={(value) => handleInputChange('project_id', value)}
              error={errors.project_id}
            />
          )}

          {/* Información del proyecto - solo si hay proyecto seleccionado */}
          {(project || formData.project_id) && project && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Información del Proyecto</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Proyecto:</span>
                  <span className="ml-2">{project.code}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Cliente:</span>
                  <span className="ml-2">{project.new_clients?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Modelo:</span>
                  <span className="ml-2">Por definir</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Potencia:</span>
                  <span className="ml-2">Por definir</span>
                </div>
              </div>
            </div>
          )}

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

          {/* Gestor de elementos/conceptos de la incidencia */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Conceptos de Reparación <span className="text-red-500">*</span></Label>
              <p className="text-sm text-gray-600">Agrega al menos un elemento específico que necesita reparación</p>
            </div>
            <IncidentItemsManager
              items={incidentItems}
              onItemsChange={(items) => {
                setIncidentItems(items);
                // Limpiar error cuando se agregan conceptos
                if (errors.items && items.length > 0) {
                  setErrors(prev => ({ ...prev, items: '' }));
                }
              }}
            />
            {errors.items && (
              <p className="text-sm text-red-600">{errors.items}</p>
            )}
          </div>

          {/* Subida de fotos */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Fotos de la Incidencia</Label>
              <p className="text-sm text-gray-600">Adjunta fotos que muestren la incidencia</p>
            </div>
            <PhotoUpload
              files={selectedFiles}
              onFilesChange={setSelectedFiles}
            />
          </div>

          {/* Campo de comentarios */}
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
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createIncident.isPending || incidentItems.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createIncident.isPending ? 'Creando...' : 'Reportar Incidencia'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentFormDialog;
