
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useIncidentItems, useCreateIncidentItem, useDeleteIncidentItem } from '@/hooks/useIncidentItems';

interface IncidentItemsManagerProps {
  incidentId?: string;
  isEditing?: boolean;
  items?: Array<{ description: string; category: string; priority: string; }>;
  onItemsChange?: (items: Array<{ description: string; category: string; priority: string; }>) => void;
}

const IncidentItemsManager: React.FC<IncidentItemsManagerProps> = ({ 
  incidentId, 
  isEditing = false,
  items: externalItems,
  onItemsChange 
}) => {
  const [newItem, setNewItem] = useState({
    description: '',
    category: 'Mobiliario',
    priority: 'medium'
  });

  // Use external items for new incidents, or fetch from DB for existing incidents
  const { data: dbItems = [], isLoading } = useIncidentItems(incidentId || '');
  const items = externalItems || dbItems;
  
  const createItem = useCreateIncidentItem();
  const deleteItem = useDeleteIncidentItem();

  const handleAddItem = async () => {
    if (!newItem.description.trim()) return;

    if (incidentId) {
      // Adding to existing incident
      await createItem.mutateAsync({
        incident_id: incidentId,
        description: newItem.description,
        category: newItem.category,
        priority: newItem.priority
      });
    } else {
      // Adding to new incident (local state)
      const newItemData = {
        description: newItem.description,
        category: newItem.category,
        priority: newItem.priority
      };
      onItemsChange?.([...items, newItemData]);
    }

    setNewItem({
      description: '',
      category: 'Mobiliario',
      priority: 'medium'
    });
  };

  const handleDeleteItem = async (index: number, itemId?: string) => {
    if (incidentId && itemId) {
      // Deleting from existing incident
      await deleteItem.mutateAsync(itemId);
    } else {
      // Deleting from new incident (local state)
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange?.(newItems);
    }
  };

  if (incidentId && isLoading) {
    return <div className="text-sm text-gray-500">Cargando conceptos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Conceptos a Reparar</Label>
        {items.length > 0 && (
          <span className="text-sm text-gray-500">{items.length} concepto{items.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Lista de conceptos existentes */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={incidentId ? (item as any).id : index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-700">#{index + 1}</span>
                  <span className="text-sm text-gray-900">{item.description}</span>
                </div>
                <div className="flex space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.priority === 'high' ? 'bg-red-100 text-red-800' :
                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              </div>
              {(isEditing || !incidentId) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(index, incidentId ? (item as any).id : undefined)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar nuevos conceptos */}
      {(isEditing || !incidentId) && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <Label className="text-sm font-medium">Agregar Nuevo Concepto</Label>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Descripción del problema</Label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Describe el problema específico..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Categoría</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobiliario">Mobiliario</SelectItem>
                    <SelectItem value="Sistema eléctrico">Sistema eléctrico</SelectItem>
                    <SelectItem value="Agua">Agua</SelectItem>
                    <SelectItem value="Gas">Gas</SelectItem>
                    <SelectItem value="Revestimiento">Revestimiento</SelectItem>
                    <SelectItem value="Vehículo">Vehículo</SelectItem>
                    <SelectItem value="Filtraciones">Filtraciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">Prioridad</Label>
                <Select value={newItem.priority} onValueChange={(value) => setNewItem({ ...newItem, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={!newItem.description.trim() || createItem.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createItem.isPending ? 'Agregando...' : 'Agregar Concepto'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentItemsManager;
