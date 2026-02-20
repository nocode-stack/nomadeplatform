import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NewBudgetItem, BudgetCalculation } from '@/types/budgets';
import { useToast } from '@/hooks/use-toast';

// Fetch items for a specific budget
export const useBudgetItems = (budgetId: string) => {
  return useQuery({
    queryKey: ['budget-items', budgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NEW_Budget_Items')
        .select('*')
        .eq('budget_id', budgetId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as NewBudgetItem[];
    },
    enabled: !!budgetId,
  });
};

// Fetch catalog items (items that are general templates)
export const useCatalogItems = () => {
  return useQuery({
    queryKey: ['catalog-items'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('NEW_Budget_Additional_Items')
        .select('*')
        .eq('is_active', true)
        .eq('is_general' as any, true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

// Create a new item in NEW_Budget_Additional_Items
export const useCreateAdditionalItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemData: { name: string, price: number, is_general: boolean, category?: string }) => {
      const { data, error } = await supabase
        .from('NEW_Budget_Additional_Items')
        .insert({
          name: itemData.name,
          price: itemData.price,
          is_general: itemData.is_general as any,
          category: itemData.category || 'Personalizado',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      if (data.is_general) {
        toast({
          title: "Plantilla guardada",
          description: "El item se ha guardado en el catálogo para futuros presupuestos.",
        });
      }
    }
  });
};

// Create budget item
export const useCreateBudgetItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemData: Omit<NewBudgetItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('NEW_Budget_Items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      queryClient.invalidateQueries({ queryKey: ['new-budgets'] });
      toast({
        title: "Item agregado",
        description: "El item se ha agregado correctamente al presupuesto.",
      });
    },
    onError: (error) => {
      console.error('Error creating budget item:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el item al presupuesto.",
        variant: "destructive",
      });
    },
  });
};

// Update budget item
export const useUpdateBudgetItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewBudgetItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('NEW_Budget_Items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      queryClient.invalidateQueries({ queryKey: ['new-budgets'] });
      toast({
        title: "Item actualizado",
        description: "El item se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating budget item:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el item.",
        variant: "destructive",
      });
    },
  });
};

// Delete budget item
export const useDeleteBudgetItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('NEW_Budget_Items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      queryClient.invalidateQueries({ queryKey: ['new-budgets'] });
      toast({
        title: "Item eliminado",
        description: "El item se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting budget item:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el item.",
        variant: "destructive",
      });
    },
  });
};

// Add catalog item to budget
export const useAddCatalogItemToBudget = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      catalogItem,
      budgetId,
      quantity = 1,
      discount_percentage = 0
    }: {
      catalogItem: NewBudgetItem;
      budgetId: string;
      quantity?: number;
      discount_percentage?: number;
    }) => {
      // Calculate line total
      const lineTotal = catalogItem.price * quantity * (1 - discount_percentage / 100);

      const itemData = {
        budget_id: budgetId,
        concept_id: catalogItem.concept_id,
        pack_id: catalogItem.pack_id,
        name: catalogItem.name,
        description: catalogItem.description,
        category: catalogItem.category,
        price: catalogItem.price,
        quantity,
        discount_percentage,
        line_total: lineTotal,
        is_custom: false,
        is_discount: false,
      };

      const { data, error } = await supabase
        .from('NEW_Budget_Items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      queryClient.invalidateQueries({ queryKey: ['new-budgets'] });
      toast({
        title: "Item agregado",
        description: "El item del catálogo se ha agregado al presupuesto.",
      });
    },
    onError: (error) => {
      console.error('Error adding catalog item to budget:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el item del catálogo al presupuesto.",
        variant: "destructive",
      });
    },
  });
};

// Enhanced calculate budget totals with pack-based electric system pricing
export const calculateBudgetTotals = (
  basePrice: number,
  packPrice: number,
  electricSystemPrice: number,
  colorModifier: number,
  items: NewBudgetItem[],
  discountPercentage: number = 0,
  ivaRate: number = 21,
  // New parameters for enhanced pricing
  electricSystemPricing?: {
    finalPrice: number;
    originalPrice: number;
    discountAmount: number;
    isFree: boolean;
    discountReason: string | null;
  }
): BudgetCalculation => {
  // Use enhanced electric system pricing if available, otherwise fallback to original
  const actualElectricSystemPrice = electricSystemPricing?.finalPrice ?? electricSystemPrice;

  const itemsTotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const subtotal = basePrice + packPrice + actualElectricSystemPrice + colorModifier + itemsTotal;
  const discountAmount = subtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const ivaAmount = subtotalAfterDiscount * (ivaRate / 100);
  const total = subtotalAfterDiscount + ivaAmount;

  return {
    basePrice,
    packPrice,
    electricSystemPrice: actualElectricSystemPrice,
    colorModifier,
    itemsTotal,
    subtotal,
    discountAmount,
    ivaAmount,
    total,
    // Add electric system pricing details for transparency
    electricSystemDetails: electricSystemPricing ? {
      originalPrice: electricSystemPricing.originalPrice,
      finalPrice: electricSystemPricing.finalPrice,
      discountAmount: electricSystemPricing.discountAmount,
      isFree: electricSystemPricing.isFree,
      discountReason: electricSystemPricing.discountReason
    } : undefined
  };
};