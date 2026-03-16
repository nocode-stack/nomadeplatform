/**
 * Standalone helper to generate a Budget PDF and upload it to Supabase Storage.
 * Used when sending an "encargo" contract to attach the budget PDF to the email.
 *
 * This replicates the data assembly from BudgetListTab's buildPrintDataFromBudget
 * but works outside of React component context (e.g., inside a mutation).
 */
import { supabase } from '../integrations/supabase/client';
import { generateBudgetPdfBlob } from '../components/crm/BudgetPdfDocument';
import type { BudgetPdfData, LineItem } from '../components/crm/BudgetPdfDocument';
import type { Location, RegionalConfig } from './useRegionalPricing';
import { getRegionalIva, getRegionalIedmt } from './useRegionalPricing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Pack Components (replicate from BudgetListTab) ─────────
const PACK_COMPONENTS: Record<string, string[]> = {
  Essentials: [
    'Escalón eléctrico',
    'Mosquitera corredera lateral',
    'Claraboya panorámica',
    'Sistema de gas GLP',
    'Monocontrol',
  ],
  Adventure: [
    'Pack Essentials',
    'Ducha exterior',
    'Toldo',
    'Sistema de Litio (100Ah)',
    'Pack cine: proyector + pantalla + altavoces JBL',
  ],
  Ultimate: [
    'Pack Essentials',
    'Pack Adventure',
    'Raintec (luz exterior)',
    'Llantas',
    'Revestimiento de ducha',
    'Acabado de cristal en ventanas traseras',
  ],
};

const getPackComponents = (packName: string): string[] => {
  const key = Object.keys(PACK_COMPONENTS).find(k =>
    packName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? PACK_COMPONENTS[key] : [];
};

/**
 * Fetches budget data, generates the PDF, uploads it to Supabase Storage,
 * and returns the public URL.
 *
 * @param budgetId - The UUID of the budget to generate the PDF for
 * @param projectId - The project ID (used for file path in storage)
 * @returns The public URL of the uploaded PDF, or null if generation failed
 */
export async function generateAndUploadBudgetPdf(
  budgetId: string,
  projectId: string
): Promise<string | null> {
  try {
    // 1. Fetch the budget with all joins
    const { data: budget, error: budgetError } = await supabase
      .from('budget')
      .select(`
        *,
        engine_option:engine_options(name),
        model_option:model_options(name),
        interior_color:interior_color_options(name),
        pack:budget_packs(name),
        client:clients!budget_client_id_fkey(name, surname, email, phone)
      `)
      .eq('id', budgetId)
      .single();

    if (budgetError || !budget) {
      console.error('Error fetching budget for PDF:', budgetError);
      return null;
    }

    // 2. Fetch budget items
    const { data: budgetItems = [] } = await supabase
      .from('budget_items')
      .select('*')
      .eq('budget_id', budgetId)
      .order('order_index');

    // 3. Fetch regional configs
    const { data: regionalConfigs } = await (supabase as any)
      .from('regional_pricing')
      .select('*');

    // 4. Build the PDF data (replicating buildPrintDataFromBudget)
    const client = budget.client as any;
    const location: Location = (budget.location as Location) || 'peninsula';

    const lineItems: LineItem[] = [];

    if (budget.base_price && budget.base_price > 0) {
      lineItems.push({
        name: 'Base Camperización + Modelo',
        subtitle: (budget.model_option as any)?.name,
        quantity: 1,
        unitPrice: budget.base_price,
        total: budget.base_price,
      });
    }

    if (budget.pack_price && budget.pack_price > 0) {
      const packName = (budget.pack as any)?.name || '';
      lineItems.push({
        name: 'Pack Equipamiento',
        subtitle: packName,
        quantity: 1,
        unitPrice: budget.pack_price,
        total: budget.pack_price,
        subItems: packName ? getPackComponents(packName) : [],
      });
    }

    if (budget.electric_system_price && budget.electric_system_price > 0) {
      lineItems.push({
        name: 'Sistema Eléctrico',
        quantity: 1,
        unitPrice: budget.electric_system_price,
        total: budget.electric_system_price,
      });
    }

    if (budget.color_modifier && budget.color_modifier !== 0) {
      lineItems.push({
        name: 'Suplemento Color',
        quantity: 1,
        unitPrice: budget.color_modifier,
        total: budget.color_modifier,
      });
    }

    (budgetItems || []).forEach((item: any) => {
      lineItems.push({
        name: item.name || 'Ítem',
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        total: item.line_total || 0,
        isDiscount: item.is_discount || false,
        isCustom: item.is_custom || false,
      });
    });

    const subtotal = budget.subtotal || 0;
    const discountPercentage = budget.discount_percentage
      ? Math.round(budget.discount_percentage * 100)
      : 0;
    const discountPercentAmount = subtotal * (budget.discount_percentage || 0);
    const discountFixed = budget.discount_amount || 0;
    const totalAfterDiscounts = Math.max(0, subtotal - discountPercentAmount - discountFixed);

    const { rate: ivaRate } = getRegionalIva(
      (regionalConfigs as RegionalConfig[] | null) || undefined,
      location
    );
    const ivaAmount = totalAfterDiscounts - totalAfterDiscounts / (1 + ivaRate / 100);
    const total = budget.total || totalAfterDiscounts;

    const { applies: iedmtApplies, autoAmount, manualAmount } = getRegionalIedmt(
      (regionalConfigs as RegionalConfig[] | null) || undefined,
      location
    );
    let iedmt = 0;
    if (iedmtApplies) {
      const engineName = (budget.engine_option as any)?.name || '';
      iedmt = engineName.toLowerCase().includes('automático') ? autoAmount : manualAmount;
    }
    const totalWithIedmt = total + iedmt;

    const dateStr = budget.created_at
      ? format(new Date(budget.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })
      : new Date().toLocaleDateString('es-ES');

    const clientName = client
      ? [client.name, client.surname].filter(Boolean).join(' ')
      : 'Cliente No Identificado';

    const pdfData: BudgetPdfData = {
      budgetCode: budget.budget_code || 'BORRADOR',
      date: dateStr,
      location,
      clientName,
      clientEmail: client?.email || '',
      clientPhone: client?.phone || '',
      modelName: (budget.model_option as any)?.name || '–',
      engineName: (budget.engine_option as any)?.name || '–',
      interiorColorName: (budget as any).interior_color?.name || '–',
      packName: (budget.pack as any)?.name || '–',
      lineItems,
      subtotal,
      discountPercentage,
      discountPercentAmount,
      discountFixed,
      discountFixedLabel: budget.discount_amount_label || undefined,
      discountPercentLabel: budget.discount_percentage_label || undefined,
      ivaRate,
      ivaAmount,
      total,
      iedmt,
      totalWithIedmt,
      reservationAmount: budget.reservation_amount || 0,
    };

    // 5. Generate the PDF blob
    console.log('[BudgetPDF] Generating PDF blob...');
    const blob = await generateBudgetPdfBlob(pdfData);
    console.log('[BudgetPDF] PDF blob generated, size:', blob.size);

    // 6. Upload to Supabase Storage (budget-pdfs bucket)
    const fileName = `${projectId}/${budget.budget_code || budgetId}.pdf`;
    console.log('[BudgetPDF] Uploading to storage:', fileName);
    const { error: uploadError } = await supabase.storage
      .from('budget-pdfs')
      .upload(fileName, blob, {
        contentType: 'application/pdf',
        upsert: true, // overwrite if exists
      });

    if (uploadError) {
      console.error('[BudgetPDF] Error uploading:', uploadError);
      return null;
    }

    // 7. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('budget-pdfs')
      .getPublicUrl(fileName);

    console.log('[BudgetPDF] Public URL:', publicUrlData?.publicUrl);
    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error('[BudgetPDF] FATAL ERROR in generateAndUploadBudgetPdf:', error);
    console.error('[BudgetPDF] Stack:', (error as Error).stack);
    return null;
  }
}
