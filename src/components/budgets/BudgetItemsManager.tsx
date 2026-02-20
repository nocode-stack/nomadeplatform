import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NewBudgetItem } from '@/types/budgets';
import { useBudgetItems, useCreateBudgetItem, useUpdateBudgetItem, useDeleteBudgetItem, useCatalogItems, useAddCatalogItemToBudget } from '@/hooks/useNewBudgetItems';

interface BudgetItemsManagerProps {
  budgetId: string;
}

interface ItemFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  discount_percentage: number;
}

export const BudgetItemsManager: React.FC<BudgetItemsManagerProps> = ({ budgetId }) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showCatalogDialog, setShowCatalogDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<NewBudgetItem | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    category: 'General',
    price: 0,
    quantity: 1,
    discount_percentage: 0,
  });

  const { data: items = [], isLoading } = useBudgetItems(budgetId);
  const { data: catalogItems = [] } = useCatalogItems();
  const createItem = useCreateBudgetItem();
  const updateItem = useUpdateBudgetItem();
  const deleteItem = useDeleteBudgetItem();
  const addCatalogItem = useAddCatalogItemToBudget();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'General',
      price: 0,
      quantity: 1,
      discount_percentage: 0,
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const lineTotal = formData.price * formData.quantity * (1 - formData.discount_percentage / 100);
    
    const itemData = {
      ...formData,
      budget_id: budgetId,
      line_total: lineTotal,
      is_custom: true,
      is_discount: false,
    };

    try {
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...itemData });
      } else {
        await createItem.mutateAsync(itemData);
      }
      setShowCustomForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item: NewBudgetItem) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || 'General',
      price: item.price,
      quantity: item.quantity,
      discount_percentage: item.discount_percentage || 0,
    });
    setEditingItem(item);
    setShowCustomForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este item?')) {
      await deleteItem.mutateAsync(itemId);
    }
  };

  const handleAddCatalogItem = async (catalogItem: NewBudgetItem) => {
    await addCatalogItem.mutateAsync({
      catalogItem,
      budgetId,
      quantity: 1,
      discount_percentage: 0,
    });
    setShowCatalogDialog(false);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.line_total, 0);
  };

  if (isLoading) {
    return <div>Cargando items...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items del Presupuesto
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={showCatalogDialog} onOpenChange={setShowCatalogDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Catálogo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Catálogo de Items</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {catalogItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">€{item.price}</Badge>
                        </div>
                      </div>
                      <Button onClick={() => handleAddCatalogItem(item)}>
                        Agregar
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCustomForm} onOpenChange={setShowCustomForm}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Item Personalizado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Editar Item' : 'Agregar Item Personalizado'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Equipamiento">Equipamiento</SelectItem>
                        <SelectItem value="Accesorios">Accesorios</SelectItem>
                        <SelectItem value="Opcionales">Opcionales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Precio (€)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Cantidad</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount">Descuento (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                      {editingItem ? 'Actualizar' : 'Agregar'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCustomForm(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay items en este presupuesto. Agrega items del catálogo o crea items personalizados.
            </p>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.is_custom && <Badge variant="secondary">Personalizado</Badge>}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>Cantidad: {item.quantity}</span>
                      <span>Precio unitario: €{item.price}</span>
                      {item.discount_percentage > 0 && (
                        <span className="text-red-600">Descuento: {item.discount_percentage}%</span>
                      )}
                      <span className="font-medium">Total: €{item.line_total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteItem.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Items:</span>
                  <span>€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};