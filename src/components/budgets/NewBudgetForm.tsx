/* eslint-disable no-console */
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { UnifiedProject } from '@/types/database';
import { NewBudget } from '@/types/budgets';
import {
  useCreateNewBudget,
  useUpdateNewBudget,
  useModelOptions,
  useEngineOptions,
  useExteriorColorOptions,
  useInteriorColorOptions,
  useNewBudgetPacks,
  useNewBudgetElectricSystems,
  useNewBudgetAdditionalItems,
  useNewBudgetItems
} from '@/hooks/useNewBudgets';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNewBudgetElectricPricing } from '@/hooks/useNewBudgetElectricPricing';
import { calculateElectricSystemPrice } from '@/hooks/useElectricSystemPricing';

interface NewBudgetFormProps {
  project: UnifiedProject;
  budget?: NewBudget | null; // Para modo edición
  onSuccess?: () => void;
}

interface BudgetFormData {
  engine_option_id: string;
  model_option_id: string;
  exterior_color_id: string;
  interior_color_id: string;
  pack_id: string;
  electric_system_id: string;
  additional_items: string[];
  status: string;
  discount_percentage: number;
  iva_rate: number;
  reservation_amount: number;
  notes: string;
}

interface CustomItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface DiscountItem {
  id: string;
  concept: string;
  amount: number;
}

export const NewBudgetForm: React.FC<NewBudgetFormProps> = ({ project, budget, onSuccess }) => {
  const { toast } = useToast();
  const createBudget = useCreateNewBudget();
  const updateBudget = useUpdateNewBudget();
  const isEditing = !!budget;

  // Flags para evitar loops infinitos en los useEffect
  const isFormInitialized = useRef<boolean>(false);
  const areItemsLoaded = useRef<boolean>(false);

  // Estado para conceptos personalizados y descuentos
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [discountItems, setDiscountItems] = useState<DiscountItem[]>([]);
  const [pendingDiscount, setPendingDiscount] = useState<DiscountItem | null>(null);
  const [pendingCustomItem, setPendingCustomItem] = useState<CustomItem | null>(null);

  // Cargar opciones del configurador
  const { data: modelOptions = [] } = useModelOptions();
  const { data: engineOptions = [] } = useEngineOptions();
  const { data: colorOptions = [] } = useExteriorColorOptions();
  const { data: interiorColorOptions = [] } = useInteriorColorOptions();
  const { data: packOptions = [] } = useNewBudgetPacks();
  const { data: electricOptions = [] } = useNewBudgetElectricSystems();
  const { data: additionalItems = [] } = useNewBudgetAdditionalItems();

  // Cargar items del presupuesto (para conceptos personalizados en modo edición)
  const { data: budgetItems = [] } = useNewBudgetItems(budget?.id);

  const { register, handleSubmit, reset, watch, setValue } = useForm<BudgetFormData>({
    defaultValues: {
      engine_option_id: '',
      model_option_id: '',
      exterior_color_id: '',
      interior_color_id: '',
      pack_id: '',
      electric_system_id: '',
      additional_items: [],
      status: 'draft',
      discount_percentage: 0,
      iva_rate: 21,
      reservation_amount: 0,
      notes: '',
    }
  });

  // Obtener los valores seleccionados para calcular precios
  const selectedEngineId = watch('engine_option_id');
  const selectedModelId = watch('model_option_id');
  const selectedColorId = watch('exterior_color_id');
  const selectedInteriorColorId = watch('interior_color_id');
  const selectedPackId = watch('pack_id');
  const selectedElectricId = watch('electric_system_id');
  const selectedAdditionalItems = watch('additional_items') || [];

  // Hook para precios dinámicos de sistemas eléctricos (solo para el seleccionado)
  const { electricPricing } = useNewBudgetElectricPricing(
    selectedPackId || null,
    selectedElectricId || null
  );


  // Efecto para inicializar el formulario en modo edición
  useEffect(() => {
    if (budget && isEditing && !isFormInitialized.current) {
      if (import.meta.env.DEV) console.log('🔄 Inicializando formulario en modo edición con presupuesto:', budget.id);

      setValue('engine_option_id', budget.engine_option_id || '');
      setValue('model_option_id', budget.model_option_id || '');
      setValue('exterior_color_id', budget.exterior_color_id || '');
      setValue('interior_color_id', budget.interior_color_id || '');
      setValue('pack_id', budget.pack_id || '');
      setValue('electric_system_id', budget.electric_system_id || '');
      setValue('status', budget.status);
      setValue('discount_percentage', (budget.discount_percentage || 0) * 100);
      setValue('iva_rate', budget.iva_rate || 21);
      setValue('reservation_amount', budget.reservation_amount || 0);
      setValue('notes', budget.notes || '');
      setValue('additional_items', []);

      isFormInitialized.current = true;
      if (import.meta.env.DEV) console.log('✅ Formulario inicializado correctamente');
    }
  }, [budget, isEditing, setValue]);

  // Efecto para cargar items existentes en modo edición
  useEffect(() => {
    if (isEditing && budgetItems.length > 0 && !areItemsLoaded.current) {
      if (import.meta.env.DEV) console.log('🔄 Cargando items existentes del presupuesto');

      // Cargar conceptos personalizados
      const customBudgetItems = budgetItems.filter(item => item.is_custom && !item.is_discount);
      const loadedCustomItems: CustomItem[] = customBudgetItems.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity
      }));

      if (import.meta.env.DEV) console.log('📋 Conceptos personalizados encontrados:', loadedCustomItems);
      setCustomItems(loadedCustomItems);

      // Cargar descuentos
      const discountBudgetItems = budgetItems.filter(item => item.is_discount);
      const loadedDiscountItems: DiscountItem[] = discountBudgetItems.map(item => ({
        id: item.id,
        concept: item.name,
        amount: Math.abs(Number(item.price))
      }));

      if (import.meta.env.DEV) console.log('💰 Descuentos encontrados:', loadedDiscountItems);
      setDiscountItems(loadedDiscountItems);

      // Cargar items adicionales seleccionados
      const additionalBudgetItems = budgetItems.filter(item => !item.is_custom && item.concept_id);
      const selectedAdditionalItemIds = additionalBudgetItems.map(item => item.concept_id).filter(Boolean);

      if (import.meta.env.DEV) console.log('🔧 Items adicionales encontrados:', selectedAdditionalItemIds);
      setValue('additional_items', selectedAdditionalItemIds);

      areItemsLoaded.current = true;
      if (import.meta.env.DEV) console.log('✅ Items cargados correctamente');
    }
  }, [budgetItems, isEditing]);

  // Resetear flags cuando cambia el presupuesto o el modo
  useEffect(() => {
    if (!isEditing) {
      if (import.meta.env.DEV) console.log('🔄 Reseteando formulario para modo creación');
      setCustomItems([]);
      setDiscountItems([]);
      setPendingDiscount(null);
      setPendingCustomItem(null);
      isFormInitialized.current = false;
      areItemsLoaded.current = false;
    }
  }, [isEditing]);

  // Resetear flags cuando cambia el ID del presupuesto
  useEffect(() => {
    if (import.meta.env.DEV) console.log('🔄 Presupuesto cambió, reseteando flags');
    isFormInitialized.current = false;
    areItemsLoaded.current = false;
  }, [budget?.id]);


  // Funciones para manejar conceptos personalizados
  const addCustomItem = () => {
    const newItem: CustomItem = {
      id: crypto.randomUUID(),
      name: '',
      price: 0,
      quantity: 1
    };
    setPendingCustomItem(newItem);
  };

  const updatePendingCustomItem = (field: keyof CustomItem, value: string | number) => {
    if (pendingCustomItem) {
      setPendingCustomItem(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const applyCustomItem = () => {
    if (pendingCustomItem && pendingCustomItem.name.trim() && pendingCustomItem.price > 0) {
      setCustomItems(prev => [...prev, pendingCustomItem]);
      setPendingCustomItem(null);
    }
  };

  const cancelPendingCustomItem = () => {
    setPendingCustomItem(null);
  };

  const removeCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id));
  };

  // Funciones para manejar descuentos
  const addDiscountItem = () => {
    const newDiscount: DiscountItem = {
      id: crypto.randomUUID(),
      concept: '',
      amount: 0
    };
    setPendingDiscount(newDiscount);
  };

  const updatePendingDiscount = (field: keyof DiscountItem, value: string | number) => {
    if (pendingDiscount) {
      setPendingDiscount(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const applyDiscount = () => {
    if (pendingDiscount && pendingDiscount.concept.trim() && pendingDiscount.amount > 0) {
      setDiscountItems(prev => [...prev, pendingDiscount]);
      setPendingDiscount(null);
    }
  };

  const cancelPendingDiscount = () => {
    setPendingDiscount(null);
  };

  const removeDiscountItem = (id: string) => {
    setDiscountItems(prev => prev.filter(item => item.id !== id));
  };

  // Calcular precio total basado en las selecciones CON PRECIOS DINÁMICOS
  const calculateTotal = () => {
    let basePrice = 0;
    let packPrice = 0;
    let electricSystemPrice = 0;
    let colorModifier = 0;
    let additionalItemsPrice = 0;
    let customItemsPrice = 0;

    // El precio está en la motorización, no en el modelo
    const selectedEngine = engineOptions.find(e => e.id === selectedEngineId);
    let enginePrice = 0;
    if (selectedEngine) {
      // Aplicar el precio de la motorización
      enginePrice = selectedEngine.price_modifier;
    }
    // El modelo siempre es gratuito (el precio está en la motorización)
    basePrice = 0;

    // Modificador de color exterior
    const selectedColor = colorOptions.find(c => c.id === selectedColorId);
    if (selectedColor) {
      colorModifier = selectedColor.price_modifier;
    }

    // Precio del pack
    const selectedPackData = packOptions.find(p => p.id === selectedPackId);
    if (selectedPackData && selectedPackData.price) {
      packPrice = selectedPackData.price;
    }

    // Precio del sistema eléctrico - USAR PRECIO DINÁMICO
    const selectedElectric = electricOptions.find(e => e.id === selectedElectricId);
    if (selectedElectric) {
      // Usar precio dinámico si está disponible, sino el precio original
      electricSystemPrice = electricPricing?.finalPrice ?? selectedElectric.price;
    }

    // Precio de items adicionales
    if (selectedAdditionalItems.length > 0) {
      additionalItemsPrice = selectedAdditionalItems.reduce((total, itemId) => {
        const item = additionalItems.find(ai => ai.id === itemId);
        return total + (item ? Number(item.price) : 0);
      }, 0);
    }

    // Precio de conceptos personalizados
    customItemsPrice = customItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Descuentos aplicados
    const discountsTotal = discountItems.reduce((total, discount) => {
      return total + discount.amount;
    }, 0);

    const totalWithoutIva = enginePrice + basePrice + colorModifier + packPrice + electricSystemPrice + additionalItemsPrice + customItemsPrice;
    const discountPercentage = watch('discount_percentage') || 0;
    const discountAmount = totalWithoutIva * (discountPercentage / 100);
    const totalAfterDiscounts = totalWithoutIva - discountAmount - discountsTotal;

    // Calcular IVA
    const ivaRate = watch('iva_rate') || 21;
    const ivaAmount = totalAfterDiscounts * (ivaRate / 100);
    const totalWithIva = totalAfterDiscounts + ivaAmount;

    return {
      basePrice,
      enginePrice, // Añadir enginePrice al return
      packPrice,
      electricSystemPrice,
      colorModifier,
      additionalItemsPrice,
      subtotal: totalWithoutIva,
      ivaAmount,
      discountAmount,
      discountsTotal,
      total: totalWithIva,
      selectedEngine,
      selectedModel: modelOptions.find(m => m.id === selectedModelId),
      selectedColor,
      selectedInteriorColor: interiorColorOptions.find(c => c.id === selectedInteriorColorId),
      selectedPack: selectedPackData,
      selectedElectric,
      selectedAdditionalItemsList: selectedAdditionalItems.map(itemId =>
        additionalItems.find(ai => ai.id === itemId)
      ).filter(Boolean)
    };
  };

  const {
    basePrice,
    enginePrice, // Extraer enginePrice
    packPrice,
    electricSystemPrice,
    colorModifier,
    additionalItemsPrice,
    subtotal,
    ivaAmount,
    discountAmount,
    discountsTotal,
    total,
    selectedEngine,
    selectedModel,
    selectedColor,
    selectedInteriorColor,
    selectedPack: selectedPackFromCalculation,
    selectedElectric,
    selectedAdditionalItemsList
  } = calculateTotal();

  const onSubmit = async (data: BudgetFormData) => {
    if (import.meta.env.DEV) console.log('🎯 onSubmit iniciado');
    if (import.meta.env.DEV) console.log('🎯 Datos del formulario:', data);
    if (import.meta.env.DEV) console.log('🎯 Modo:', isEditing ? 'Edición' : 'Creación');
    if (import.meta.env.DEV) console.log('🎯 createBudget.isPending:', createBudget.isPending);
    if (import.meta.env.DEV) console.log('🎯 updateBudget.isPending:', updateBudget.isPending);

    const budgetData = {
      project_id: project.id,
      engine_option_id: data.engine_option_id || null,
      model_option_id: data.model_option_id || null,
      exterior_color_id: data.exterior_color_id || null,
      interior_color_id: data.interior_color_id || null,
      pack_id: data.pack_id || null,
      electric_system_id: data.electric_system_id || null,
      base_price: enginePrice, // Usar el precio de la motorización en lugar de basePrice
      pack_price: packPrice,
      electric_system_price: electricSystemPrice,
      color_modifier: colorModifier,
      subtotal,
      discount_amount: isNaN(discountAmount) ? 0 : (discountAmount || 0),
      total,
      status: data.status,
      notes: data.notes || null,
      iva_rate: data.iva_rate, // IVA configurable
      reservation_amount: data.reservation_amount || 0,
      discount_percentage: (data.discount_percentage || 0) / 100, // Guardar como decimal (ej. 0.05 para 5%)
    };

    if (import.meta.env.DEV) console.log('🎯 Datos a enviar a la base de datos:', budgetData);

    try {
      let budgetResult;
      if (isEditing && budget) {
        budgetResult = await updateBudget.mutateAsync({
          id: budget.id,
          ...budgetData,
        });
      } else {
        budgetResult = await createBudget.mutateAsync(budgetData);
      }
      // Guardar items adicionales, conceptos personalizados y descuentos en NEW_Budget_Items
      const validCustomItems = customItems.filter(item => item.name.trim() && item.price > 0);
      const validDiscountItems = discountItems.filter(item => item.concept.trim() && item.amount > 0);
      const selectedAdditionalItemsData = selectedAdditionalItems.map(itemId =>
        additionalItems.find(ai => ai.id === itemId)
      ).filter(Boolean);

      // Primero eliminar items existentes si es edición
      if (isEditing && budget) {
        await supabase
          .from('NEW_Budget_Items')
          .delete()
          .eq('budget_id', budget.id);
      }

      const allItemsToInsert = [];

      // Insertar items adicionales seleccionados
      if (selectedAdditionalItemsData.length > 0) {
        if (import.meta.env.DEV) console.log('🔧 Guardando items adicionales:', selectedAdditionalItemsData);

        const additionalItemsToInsert = selectedAdditionalItemsData.map((item, index) => ({
          budget_id: isEditing && budget ? budget.id : budgetResult.id,
          concept_id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          line_total: Number(item.price),
          is_custom: false,
          is_discount: false,
          order_index: index
        }));

        allItemsToInsert.push(...additionalItemsToInsert);
      }

      // Insertar conceptos personalizados
      if (validCustomItems.length > 0) {
        if (import.meta.env.DEV) console.log('💼 Guardando conceptos personalizados:', validCustomItems);

        const customItemsToInsert = validCustomItems.map((item, index) => ({
          budget_id: isEditing && budget ? budget.id : budgetResult.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          line_total: item.price * item.quantity,
          is_custom: true,
          is_discount: false,
          order_index: selectedAdditionalItemsData.length + index
        }));

        allItemsToInsert.push(...customItemsToInsert);
      }

      // Insertar descuentos
      if (validDiscountItems.length > 0) {
        if (import.meta.env.DEV) console.log('💰 Guardando descuentos:', validDiscountItems);

        const discountItemsToInsert = validDiscountItems.map((item, index) => ({
          budget_id: isEditing && budget ? budget.id : budgetResult.id,
          name: item.concept,
          price: -item.amount, // Precio negativo para descuentos
          quantity: 1,
          line_total: -item.amount,
          is_custom: true,
          is_discount: true,
          order_index: selectedAdditionalItemsData.length + validCustomItems.length + index
        }));

        allItemsToInsert.push(...discountItemsToInsert);
      }

      // Insertar todos los items de una vez
      if (allItemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('NEW_Budget_Items')
          .insert(allItemsToInsert);

        if (itemsError) {
          console.error('❌ Error al guardar items del presupuesto:', itemsError);
          throw new Error('Error al guardar items del presupuesto');
        }

        if (import.meta.env.DEV) console.log('✅ Items del presupuesto guardados correctamente');
      }

      // Los items adicionales ahora se guardan automáticamente con el cálculo
      if (import.meta.env.DEV) console.log('✅ Items adicionales incluidos en el cálculo del total');

      if (!isEditing) {
        reset();
      }

      toast({
        title: "Éxito",
        description: isEditing ? "Presupuesto actualizado correctamente." : "Presupuesto creado correctamente.",
      });

      onSuccess?.();
    } catch (error: unknown) {
      console.error('❌ Error al guardar presupuesto:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el presupuesto.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, (errors) => {
      if (import.meta.env.DEV) console.log('❌ Errores de validación:', errors);
      toast({
        variant: "destructive",
        title: "Error en el formulario",
        description: "Por favor, completa todos los campos obligatorios.",
      });
    })} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[80vh] max-h-[80vh]">
        {/* Configuración del Vehículo - 2/3 del ancho */}
        <div className="lg:col-span-2 h-full overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg">Configuración del Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-6">

              {/* Motorización */}
              <div>
                <Label className="text-base font-medium mb-3 block">1. Selecciona la Motorización</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {engineOptions.map((engine) => (
                    <label key={engine.id} className="relative">
                      <input
                        type="radio"
                        {...register('engine_option_id', { required: 'Selecciona una motorización' })}
                        value={engine.id}
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-colors">
                        <div className="font-semibold">{engine.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {engine.power} • {engine.transmission}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {engine.name === 'Solo camperización'
                            ? `€${Math.round(engine.price_modifier * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}`
                            : engine.price_modifier !== 0
                              ? `+€${Math.round(engine.price_modifier * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}`
                              : 'Incluido'
                          }
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Modelo */}
              <div>
                <Label className="text-base font-medium mb-3 block">2. Selecciona el Modelo</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {modelOptions.map((model) => (
                    <label key={model.id} className="relative">
                      <input
                        type="radio"
                        {...register('model_option_id', { required: 'Selecciona un modelo' })}
                        value={model.id}
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-colors">
                        <div className="font-semibold">{model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedEngine?.name === 'Solo camperización' && model.price_modifier === 0
                            ? 'Incluido en camperización'
                            : model.price_modifier !== 0
                              ? `+€${Math.round(model.price_modifier * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}`
                              : 'Incluido'
                          }
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Exterior - Solo mostrar si NO es "Solo camperización" */}
              {selectedEngine?.name !== 'Solo camperización' && (
                <div>
                  <Label className="text-base font-medium mb-3 block">3. Selecciona el Color Exterior</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {colorOptions.map((color) => (
                      <label key={color.id} className="relative">
                        <input
                          type="radio"
                          {...register('exterior_color_id', { required: selectedEngine?.name !== 'Solo camperización' ? 'Selecciona un color' : false })}
                          value={color.id}
                          className="sr-only peer"
                        />
                        <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: color.color_code || '#000' }}
                            ></div>
                            <div>
                              <div className="font-semibold">{color.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {color.price_modifier > 0 ? `+€${Math.round(color.price_modifier * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}` : 'Incluido'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Mobiliario */}
              <div>
                <Label className="text-base font-medium mb-3 block">4. Selecciona el Color Mobiliario</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {interiorColorOptions.map((color) => (
                    <label key={color.id} className="relative">
                      <input
                        type="radio"
                        {...register('interior_color_id')}
                        value={color.id}
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color.color_code || '#000' }}
                          ></div>
                          <div>
                            <div className="font-semibold">{color.name}</div>
                            <div className="text-sm text-muted-foreground">Incluido</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Packs */}
              <div>
                <Label className="text-base font-medium mb-3 block">5. Packs</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {packOptions
                    .sort((a, b) => {
                      const order = { 'Essentials': 1, 'Adventure': 2, 'Ultimate': 3 };
                      return (order[a.name] || 999) - (order[b.name] || 999);
                    })
                    .map((pack) => (
                      <label key={pack.id} className="relative">
                        <input
                          type="radio"
                          {...register('pack_id')}
                          value={pack.id}
                          className="sr-only peer"
                        />
                        <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-colors">
                          <div className="font-semibold">{pack.name}</div>
                          <div className="text-sm text-muted-foreground mb-2">{pack.description}</div>
                          <Badge variant="secondary">€{Math.round(Number(pack.price) * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}</Badge>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              {/* Sistemas Eléctricos - ACTUALIZADO CON PRECIOS DINÁMICOS */}
              <div>
                <Label className="text-base font-medium mb-3 block">6. Sistema Eléctrico</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {electricOptions.map((electric) => {
                    // Calcular precio dinámico para este sistema específico usando el hook
                    const isSelected = selectedElectricId === electric.id;
                    const selectedPackData = packOptions.find(p => p.id === selectedPackId);

                    // Calcular precio dinámico para ESTE sistema específico (no solo el seleccionado)
                    let dynamicPrice = electric.price;
                    let hasDiscount = false;
                    let isFree = false;
                    let discountReason = null;

                    // Si hay un pack seleccionado, calcular precio dinámico para este sistema
                    if (selectedPackData && electric.pack_pricing_rules) {
                      const pricing = calculateElectricSystemPrice(
                        electric.price,
                        electric.pack_pricing_rules,
                        selectedPackId,
                        selectedPackData.name
                      );
                      dynamicPrice = pricing.finalPrice;
                      hasDiscount = pricing.discountAmount > 0;
                      isFree = pricing.isFree;
                      discountReason = pricing.discountReason;
                    }

                    const originalPrice = electric.price;

                    // Ya no hay auto-selección automática de sistemas eléctricos
                    const isAutoSelected = false;

                    return (
                      <label key={electric.id} className="relative">
                        <input
                          type="radio"
                          {...register('electric_system_id')}
                          value={electric.id}
                          className="sr-only peer"
                        />
                        <div className={`p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition-colors`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{electric.name}</div>
                            {/* Ya no hay indicador de auto-selección */}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{electric.description}</div>
                          <div className="flex flex-col gap-1">
                            {isFree ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Incluido en {selectedPackData?.name}
                              </Badge>
                            ) : hasDiscount ? (
                              <div className="flex flex-col">
                                <span className="text-sm line-through text-muted-foreground">
                                  €{Math.round(originalPrice * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}
                                </span>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  €{Math.round(dynamicPrice * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="secondary">
                                {dynamicPrice === 0 ? 'Incluido' : `+€${Math.round(dynamicPrice * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}`}
                              </Badge>
                            )}
                          </div>
                          {discountReason && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {discountReason}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Items Adicionales */}
              <div>
                <Label className="text-base font-medium mb-3 block">6. Items Adicionales (opcionales)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {additionalItems.map((item) => (
                    <label key={item.id} className="relative flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="checkbox"
                        {...register('additional_items')}
                        value={item.id}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <Badge variant="secondary">+€{Math.round(Number(item.price) * (1 + (watch('iva_rate') || 21) / 100)).toLocaleString('es-ES')}</Badge>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conceptos Personalizados */}
              <div>
                <Label className="text-base font-medium mb-3 block">7. Conceptos Personalizados</Label>

                <div className="space-y-3">
                  {/* Conceptos aplicados */}
                  {customItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border-2 rounded-lg bg-muted/30">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity} • Precio: €{item.price.toLocaleString()} • Total: €{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Formulario para nuevo concepto */}
                  {pendingCustomItem && (
                    <div className="p-4 border-2 rounded-lg bg-muted/30">
                      <div className="space-y-3">
                        <Input
                          placeholder="Nombre del concepto"
                          value={pendingCustomItem.name}
                          onChange={(e) => updatePendingCustomItem('name', e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Precio"
                            min="0"
                            step="0.01"
                            value={pendingCustomItem.price || ''}
                            onChange={(e) => updatePendingCustomItem('price', parseFloat(e.target.value) || 0)}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            min="1"
                            value={pendingCustomItem.quantity}
                            onChange={(e) => updatePendingCustomItem('quantity', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={applyCustomItem}
                            disabled={!pendingCustomItem.name.trim() || pendingCustomItem.price <= 0}
                            className="flex-1"
                          >
                            Aplicar Concepto
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelPendingCustomItem}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!pendingCustomItem && (
                    <div className="flex justify-center pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCustomItem}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Añadir Concepto Personalizado
                      </Button>
                    </div>
                  )}

                  {customItems.length === 0 && !pendingCustomItem && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No hay conceptos personalizados añadidos</p>
                      <p className="text-sm">Haz click en "Añadir Concepto Personalizado" para crear uno</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descuentos */}
              <div>
                <Label className="text-base font-medium mb-3 block">8. Descuentos</Label>

                <div className="space-y-3">
                  {/* Descuentos aplicados */}
                  {discountItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border-2 rounded-lg bg-red-50 border-red-200">
                      <div>
                        <div className="font-medium">{item.concept}</div>
                        <div className="text-sm text-red-600">-€{item.amount.toLocaleString()}</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDiscountItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Formulario para nuevo descuento */}
                  {pendingDiscount && (
                    <div className="p-4 border-2 rounded-lg bg-red-50 border-red-200">
                      <div className="space-y-3">
                        <Input
                          placeholder="Concepto del descuento"
                          value={pendingDiscount.concept}
                          onChange={(e) => updatePendingDiscount('concept', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Importe a descontar"
                          min="0"
                          step="0.01"
                          value={pendingDiscount.amount || ''}
                          onChange={(e) => updatePendingDiscount('amount', parseFloat(e.target.value) || 0)}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={applyDiscount}
                            disabled={!pendingDiscount.concept.trim() || pendingDiscount.amount <= 0}
                            className="flex-1"
                          >
                            Aplicar Descuento
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelPendingDiscount}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!pendingDiscount && (
                    <div className="flex justify-center pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addDiscountItem}
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Plus className="w-4 h-4" />
                        Añadir Descuento
                      </Button>
                    </div>
                  )}

                  {discountItems.length === 0 && !pendingDiscount && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No hay descuentos aplicados</p>
                      <p className="text-sm">Haz click en "Añadir Descuento" para crear uno</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del Presupuesto - 1/3 del ancho */}
        <div className="lg:col-span-1 h-full overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg">Resumen del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Desglose de precios */}
              <div className="space-y-3">
                {selectedEngine && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{selectedEngine.name}</span>
                    <span className="font-semibold">
                      {selectedEngine.name === 'Solo camperización'
                        ? `€${selectedEngine.price_modifier.toLocaleString()}`
                        : selectedEngine.price_modifier > 0
                          ? `+€${selectedEngine.price_modifier.toLocaleString()}`
                          : 'Incluido'
                      }
                    </span>
                  </div>
                )}

                {selectedModel && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Modelo {selectedModel.name}</span>
                    <span className="font-semibold">Incluido</span>
                  </div>
                )}

                {selectedColor && selectedEngine?.name !== 'Solo camperización' && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Color exterior: {selectedColor.name}</span>
                    <span className="font-semibold">
                      {selectedColor.price_modifier > 0 ? `+€${selectedColor.price_modifier.toLocaleString()}` : 'Incluido'}
                    </span>
                  </div>
                )}

                {selectedInteriorColor && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Color mobiliario: {selectedInteriorColor.name}</span>
                    <span className="font-semibold">Incluido</span>
                  </div>
                )}

                {selectedPackFromCalculation && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Pack {selectedPackFromCalculation.name}</span>
                    <span className="font-semibold">€{Number(selectedPackFromCalculation.price).toLocaleString()}</span>
                  </div>
                )}

                {selectedElectric && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex flex-col">
                      <span className="text-sm">Sistema {selectedElectric.name}</span>
                      {electricPricing?.discountReason && (
                        <span className="text-xs text-muted-foreground">{electricPricing.discountReason}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      {electricPricing?.isFree ? (
                        <span className="font-semibold text-green-600">Incluido</span>
                      ) : electricPricing && electricPricing.discountAmount > 0 ? (
                        <>
                          <span className="text-sm line-through text-muted-foreground">
                            €{Number(selectedElectric.price).toLocaleString()}
                          </span>
                          <span className="font-semibold text-orange-600">
                            €{electricPricing.finalPrice.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold">€{Number(selectedElectric.price).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )}

                {selectedAdditionalItemsList.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-semibold">+€{Number(item.price).toLocaleString()}</span>
                  </div>
                ))}

                {customItems.filter(item => item.name && item.price > 0).map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{item.name} {item.quantity > 1 && `x${item.quantity}`}</span>
                    <span className="font-semibold">+€{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}

                {discountItems.filter(item => item.concept && item.amount > 0).map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b text-red-600">
                    <span className="text-sm">{item.concept}</span>
                    <span className="font-semibold">-€{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4">
                <div>
                  <Label htmlFor="iva_rate">IVA (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register('iva_rate')}
                  />
                </div>

                <div>
                  <Label htmlFor="discount_percentage">Descuento (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register('discount_percentage')}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Input {...register('notes')} placeholder="Notas adicionales..." />
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal (sin IVA):</span>
                  <span className="font-semibold">€{subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {(watch('iva_rate') || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>IVA ({watch('iva_rate')}%):</span>
                    <span className="font-semibold">€{ivaAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {watch('discount_percentage') > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento (%):</span>
                    <span>-€{discountAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {discountsTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuentos aplicados:</span>
                    <span>-€{discountsTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>{(watch('iva_rate') || 0) > 0 ? 'TOTAL (con IVA):' : 'PRECIO NETO:'}</span>
                  <span>€{total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createBudget.isPending || updateBudget.isPending}
              >
                {createBudget.isPending || updateBudget.isPending
                  ? (isEditing ? 'Actualizando...' : 'Creando...')
                  : (isEditing ? 'Actualizar Presupuesto' : 'Crear Presupuesto')
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};
