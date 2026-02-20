
import React, { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Plus,
    Trash2,
    Search,
    Package,
    Check,
    Save,
    X,
    ShoppingCart
} from 'lucide-react';
import { useCatalogItems, useCreateAdditionalItem } from '@/hooks/useNewBudgetItems';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../ui/popover';

interface BudgetItemManagerProps {
    form: UseFormReturn<any>;
    disabled?: boolean;
    hidePrices?: boolean;
    projectId?: string;
    budgetId?: string;
}

const BudgetItemManager = ({ form, disabled = false, hidePrices = false, projectId, budgetId }: BudgetItemManagerProps) => {
    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const { data: catalogItems = [] } = useCatalogItems();
    const createAdditionalItemMutation = useCreateAdditionalItem();
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', price: 0, save_as_template: false });
    const [openPopover, setOpenPopover] = useState(false);

    const handleAddFromCatalog = (item: any) => {
        append({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            is_custom: false,
            save_as_template: false
        });
        setOpenPopover(false);
    };

    const handleAddCustom = async () => {
        if (!newItem.name || newItem.price <= 0) return;

        try {
            // Si se marcó guardar como plantilla, crear en el catálogo
            if (newItem.save_as_template) {
                await createAdditionalItemMutation.mutateAsync({
                    name: newItem.name,
                    price: newItem.price,
                    is_general: true
                });
            }
        } catch (error) {
            console.error("Error creating template item:", error);
        }

        append({
            name: newItem.name,
            price: newItem.price,
            quantity: 1,
            is_custom: true,
            save_as_template: newItem.save_as_template
        });

        setNewItem({ name: '', price: 0, save_as_template: false });
        setIsAddingCustom(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Items Adicionales
                </h4>
                <div className="flex gap-2">
                    <Popover open={openPopover} onOpenChange={setOpenPopover}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 rounded-xl" disabled={disabled}>
                                <Search className="w-4 h-4" /> Catálogo
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-80" align="end">
                            <Command>
                                <CommandInput placeholder="Buscar item..." />
                                <CommandList>
                                    <CommandEmpty>No se encontraron items.</CommandEmpty>
                                    <CommandGroup heading="Items de Catálogo">
                                        {catalogItems.map((item: any) => (
                                            <CommandItem
                                                key={item.id}
                                                onSelect={() => handleAddFromCatalog(item)}
                                                className="flex justify-between items-center"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-xs text-muted-foreground">{item.category || 'General'}</span>
                                                </div>
                                                {!hidePrices && <span className="font-bold">{(item.price || 0).toLocaleString()}€</span>}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 rounded-xl"
                        onClick={() => setIsAddingCustom(true)}
                        disabled={disabled || isAddingCustom}
                    >
                        <Plus className="w-4 h-4" /> Nuevo Personalizado
                    </Button>
                </div>
            </div>

            {/* Formulario para nuevo item personalizado */}
            {isAddingCustom && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nombre del Concepto</Label>
                            <Input
                                placeholder="Ej: Neumáticos All-Terrain"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="h-10 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Precio (€)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={newItem.price || ''}
                                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                className="h-10 rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="save_template"
                                checked={newItem.save_as_template}
                                onCheckedChange={(checked) => setNewItem({ ...newItem, save_as_template: !!checked })}
                            />
                            <Label htmlFor="save_template" className="text-sm cursor-pointer">
                                Guardar para futuros presupuestos
                            </Label>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsAddingCustom(false)}>
                                <X className="w-4 h-4 mr-2" /> Cancelar
                            </Button>
                            <Button type="button" size="sm" onClick={handleAddCustom} className="bg-primary shadow-lg shadow-primary/20">
                                <Check className="w-4 h-4 mr-2" /> Agregar Item
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de items agregados */}
            <div className="space-y-2">
                {fields.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl text-muted-foreground bg-muted/5">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No hay items adicionales en este presupuesto.</p>
                    </div>
                ) : (
                    <div className="border border-border rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="py-3 px-4 text-left font-bold">Concepto</th>
                                    <th className="py-3 px-4 text-center font-bold">Cant.</th>
                                    {!hidePrices && (
                                        <>
                                            <th className="py-3 px-4 text-right font-bold">Precio</th>
                                            <th className="py-3 px-4 text-right font-bold">Total</th>
                                        </>
                                    )}
                                    <th className="py-3 px-4 text-right font-bold w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {fields.map((field: any, index) => (
                                    <tr key={field.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{field.name}</span>
                                                {field.is_custom && (
                                                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">
                                                        Personalizado {field.save_as_template && "• Guardar como plantilla"}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    value={field.quantity}
                                                    onChange={(e) => update(index, { ...field, quantity: parseInt(e.target.value) || 1 })}
                                                    className="w-12 h-8 text-center bg-background border border-border rounded-lg text-sm"
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </td>
                                        {!hidePrices && (
                                            <>
                                                <td className="py-3 px-4 text-right font-medium">
                                                    {field.price.toLocaleString()}€
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-primary">
                                                    {(field.price * field.quantity).toLocaleString()}€
                                                </td>
                                            </>
                                        )}
                                        <td className="py-3 px-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg group-hover:opacity-100 transition-opacity"
                                                onClick={() => remove(index)}
                                                disabled={disabled}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetItemManager;
