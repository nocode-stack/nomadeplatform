
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((o: string) => o.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // === AUTH: Verify JWT token ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { budgetId } = await req.json()

    // Obtener datos completos del presupuesto
    const budgetData = await getBudgetData(supabase, budgetId)

    // Generar HTML del presupuesto
    const html = generateBudgetHTML(budgetData)

    return new Response(
      JSON.stringify({
        success: true,
        html: html,
        message: 'PDF HTML generado correctamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error generating budget PDF');
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function getBudgetData(supabase: ReturnType<typeof createClient>, budgetId: string) {
  // Obtener presupuesto con todas las relaciones
  const { data: budget, error: budgetError } = await supabase
    .from('NEW_Budget')
    .select(`
      *,
      model_options(name, price_modifier),
      engine_options(name, power, transmission, price_modifier),
      exterior_color_options(name, price_modifier),
      interior_color_options(name, price_modifier),
      NEW_Budget_Packs(name, description, price),
      NEW_Budget_Electric(name, description, price),
      NEW_Projects(
        *,
        NEW_Clients(*)
      )
    `)
    .eq('id', budgetId)
    .single()

  if (budgetError) throw budgetError

  // Obtener items del presupuesto
  const { data: items, error: itemsError } = await supabase
    .from('NEW_Budget_Items')
    .select('*')
    .eq('budget_id', budgetId)
    .order('order_index')

  if (itemsError) throw itemsError

  // Obtener información de la empresa
  const { data: companyInfo, error: companyError } = await supabase
    .from('NEW_Nomade_Info')
    .select('*')
    .eq('is_active', true)
    .single()

  if (companyError) throw companyError

  return {
    ...budget,
    items: items || [],
    company: companyInfo
  }
}

function generateBudgetHTML(budgetData: Record<string, any>) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    });
  };

  const client = budgetData.NEW_Projects?.NEW_Clients;
  const project = budgetData.NEW_Projects;
  const company = budgetData.company;

  // Calcular totales usando el presupuesto completo
  const subtotal = budgetData.subtotal || 0;
  const discount_amount = budgetData.discount_amount || 0;
  const ivaBase = subtotal - discount_amount;
  const ivaAmount = ivaBase * (budgetData.iva_rate / 100);
  const total = budgetData.total || 0;

  // Construir todos los conceptos del presupuesto en el orden correcto
  const allConcepts = [];

  // 1. MOTOR PRIMERO - con el precio de base_price (que ahora contiene el precio de la motorización)
  if (budgetData.engine_options?.name) {
    // Limpiar el nombre del motor para "Solo camperización" 
    let engineDisplayName = budgetData.engine_options.name;
    const power = budgetData.engine_options.power;
    const transmission = budgetData.engine_options.transmission;

    // Si es "Solo camperización", no añadir power y transmission si son nulos/vacíos
    if (engineDisplayName === 'Solo camperización') {
      engineDisplayName = 'Motor Solo camperización';
    } else {
      // Para otros motores, construir el nombre completo si hay power y transmission
      const engineParts = [engineDisplayName];
      if (power && power !== 'N/A' && power.trim() !== '') engineParts.push(power);
      if (transmission && transmission !== 'N/A' && transmission.trim() !== '') engineParts.push(transmission);
      engineDisplayName = `Motor ${engineParts.join(' ')}`;
    }

    allConcepts.push({
      name: engineDisplayName,
      quantity: 1,
      price: budgetData.base_price || 0, // Usar base_price que contiene el precio del motor
      discount: 0,
      total: budgetData.base_price || 0,
      isDiscount: false
    });
  }

  // 2. MODELO DESPUÉS - siempre con precio 0 (Incluido)
  if (budgetData.model_options?.name) {
    allConcepts.push({
      name: budgetData.model_options.name,
      quantity: 1,
      price: 0, // Siempre 0 para el modelo
      discount: 0,
      total: 0,
      isDiscount: false
    });
  }

  // 3. Color exterior si existe
  if (budgetData.exterior_color_options?.name) {
    const colorPrice = budgetData.exterior_color_options?.price_modifier || 0;
    allConcepts.push({
      name: `Color exterior ${budgetData.exterior_color_options.name}`,
      quantity: 1,
      price: colorPrice,
      discount: 0,
      total: colorPrice,
      isDiscount: false
    });
  }

  // 4. Color interior si existe
  if (budgetData.interior_color_options?.name) {
    const interiorPrice = budgetData.interior_color_options?.price_modifier || 0;
    allConcepts.push({
      name: `Color interior ${budgetData.interior_color_options.name}`,
      quantity: 1,
      price: interiorPrice,
      discount: 0,
      total: interiorPrice,
      isDiscount: false
    });
  }

  // 5. Pack si existe
  if (budgetData.NEW_Budget_Packs?.name) {
    const packPrice = budgetData.NEW_Budget_Packs?.price || budgetData.pack_price || 0;
    allConcepts.push({
      name: `Pack ${budgetData.NEW_Budget_Packs.name}`,
      quantity: 1,
      price: packPrice,
      discount: 0,
      total: packPrice,
      isDiscount: false
    });
  }

  // 6. Sistema eléctrico si existe
  if (budgetData.NEW_Budget_Electric?.name) {
    const electricPrice = budgetData.NEW_Budget_Electric?.price || budgetData.electric_system_price || 0;
    allConcepts.push({
      name: `Sistema eléctrico ${budgetData.NEW_Budget_Electric.name}`,
      quantity: 1,
      price: electricPrice,
      discount: 0,
      total: electricPrice,
      isDiscount: false
    });
  }

  // 7. Añadir items adicionales (no descuentos)
  if (budgetData.items && budgetData.items.length > 0) {
    budgetData.items.forEach((item: Record<string, any>) => {
      if (!item.is_discount) {
        allConcepts.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount_percentage || 0,
          total: item.line_total,
          isDiscount: false
        });
      }
    });
  }

  // 8. Añadir descuentos al final
  const discountItems = [];
  if (budgetData.items && budgetData.items.length > 0) {
    budgetData.items.forEach((item: any) => {
      if (item.is_discount) {
        discountItems.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount_percentage || 0,
          total: item.line_total,
          isDiscount: true
        });
      }
    });
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Presupuesto ${budgetData.budget_code || ''}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
        }
        
        .header {
          background: linear-gradient(135deg, #4a5568, #718096);
          color: white;
          padding: 30px 20px;
          margin-bottom: 30px;
          border-radius: 8px;
          text-align: center;
        }
        
        .logo {
          max-height: 80px;
          max-width: 300px;
          margin-bottom: 15px;
          object-fit: contain;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 2px;
        }
        
        .header .subtitle {
          margin: 5px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        
        .budget-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        
        .client-section, .company-section {
          flex: 1;
        }
        
        .company-section {
          text-align: right;
          margin-left: 30px;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 14px;
          color: #2d3748;
          margin-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 5px;
        }
        
        .info-line {
          margin: 5px 0;
          font-size: 12px;
        }
        
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .items-table th { 
          background: linear-gradient(135deg, #4a5568, #718096);
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 11px;
          border: none;
        }
        
        .items-table td { 
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }
        
        .items-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .discount-row {
          background-color: #ffe6e6 !important;
          color: #cc0000;
        }
        
        .totals-section {
          margin-top: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .totals-table {
          width: 100%;
          max-width: 400px;
          margin-left: auto;
        }
        
        .totals-table td {
          padding: 8px 12px;
          border: none;
        }
        
        .subtotal-row {
          border-bottom: 1px solid #cbd5e0;
        }
        
        .iva-row {
          border-bottom: 2px solid #4a5568;
        }
        
        .total-row {
          background: linear-gradient(135deg, #ed8936, #f6ad55);
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .legal-text {
          margin-top: 30px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
          font-size: 11px;
          color: #666;
          line-height: 1.5;
        }
        
        .bank-info {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          color: #2d3748;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #718096;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        
        .highlight {
          background: #fef5e7;
          padding: 2px 6px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PRESUPUESTO NOMADE NATION</h1>
        <div class="subtitle">Código: ${budgetData.budget_code || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
      </div>
      
      <div class="budget-info">
        <div class="client-section">
          <div class="section-title">DATOS DEL CLIENTE</div>
          <div class="info-line"><strong>Nombre:</strong> ${client?.name || project?.client_name || 'N/A'}</div>
          ${client?.email ? `<div class="info-line"><strong>Email:</strong> ${client.email}</div>` : ''}
          ${client?.phone ? `<div class="info-line"><strong>Teléfono:</strong> ${client.phone}</div>` : ''}
          ${client?.address ? `<div class="info-line"><strong>Dirección:</strong> ${client.address}</div>` : ''}
          ${client?.dni ? `<div class="info-line"><strong>DNI/CIF:</strong> ${client.dni}</div>` : ''}
        </div>
        
        <div class="company-section">
          <div class="section-title">DATOS DE LA EMPRESA</div>
          <div class="info-line"><strong>Nombre:</strong> ${company?.company_name || 'N/A'}</div>
          <div class="info-line"><strong>NIF:</strong> ${company?.nif || 'N/A'}</div>
          <div class="info-line"><strong>Dirección:</strong> ${company?.address || 'N/A'}</div>
          <div class="info-line"><strong>Ciudad:</strong> ${company?.city || 'N/A'}</div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 35%">CONCEPTO</th>
            <th style="width: 15%">CANTIDAD</th>
            <th style="width: 20%">PRECIO UNIT.</th>
            <th style="width: 15%">DESCUENTO</th>
            <th style="width: 15%">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${allConcepts.map((concept: Record<string, any>) => `
            <tr>
              <td><strong>${concept.name}</strong></td>
              <td style="text-align: center">${concept.quantity}</td>
              <td style="text-align: right">${concept.price === 0 ? 'Incluido' : formatPrice(concept.price)}</td>
              <td style="text-align: center">${concept.discount}%</td>
              <td style="text-align: right"><strong>${concept.total === 0 ? 'Incluido' : formatPrice(concept.total)}</strong></td>
            </tr>
          `).join('')}
          
          ${discountItems.map((discount: Record<string, any>) => `
            <tr class="discount-row">
              <td><strong>${discount.name}</strong></td>
              <td style="text-align: center">${discount.quantity}</td>
              <td style="text-align: right">${formatPrice(discount.price)}</td>
              <td style="text-align: center">${discount.discount}%</td>
              <td style="text-align: right"><strong>${formatPrice(discount.total)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <table class="totals-table">
          <tr class="subtotal-row">
            <td><strong>Subtotal:</strong></td>
            <td style="text-align: right"><strong>${formatPrice(subtotal)}</strong></td>
          </tr>
          ${budgetData.discount_percentage > 0 ? `
          <tr class="subtotal-row" style="color: #c53030;">
            <td><strong>Descuento (${Math.round(budgetData.discount_percentage * 100)}%):</strong></td>
            <td style="text-align: right"><strong>-${formatPrice(budgetData.discount_amount || 0)}</strong></td>
          </tr>
          ` : ''}
          <tr class="iva-row">
            <td><strong>IVA (${budgetData.iva_rate || 21}%):</strong></td>
            <td style="text-align: right"><strong>${formatPrice(ivaAmount)}</strong></td>
          </tr>
          <tr class="total-row">
            <td><strong>TOTAL:</strong></td>
            <td style="text-align: right"><strong>${formatPrice(total)}</strong></td>
          </tr>
        </table>
      </div>

      <div class="legal-text">
        <p>${company?.legal_text || 'Este presupuesto no incluye impuestos de matriculación. Este importe se deberá abonar por parte del cliente una vez comprado el vehículo. El importe de matriculación puede variar según la antigüedad del vehículo, quedando exentos, personas con un 30% o más de discapacidad, personas con dependencia, autónomos o empresas.'}</p>
      </div>

      <div class="bank-info">
        <p>Nomade Nation // Banco Santander ES${company?.bank_santander || '2300491873652010517965'} // Banco Sabadell ES${company?.bank_sabadell || '80 0081 7011 1900 0384 8192'}</p>
      </div>

    </body>
    </html>
  `;
}
