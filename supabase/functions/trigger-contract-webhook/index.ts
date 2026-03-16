import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(o => o.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Helper function to format price in Spanish format
const formatSpanishPrice = (price: number): string => {
  if (price === null || price === undefined) {
    return '0,00';
  }

  // Round to 2 decimal places
  const rounded = Math.round(price * 100) / 100;

  // Format with Spanish locale (thousands separator: ., decimal separator: ,)
  return rounded.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

serve(async (req) => {
  // Handle CORS preflight requests
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTH: Verify JWT token or service key ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Accept anon key or service_role key (from DB trigger via pg_net)
    const isServiceCall = token === anonKey || token === serviceRoleKey;
    let senderEmail = '';

    if (!isServiceCall) {
      // Try as user JWT
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        anonKey
      );
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      senderEmail = user.email || '';
    }

    const { record } = await req.json();

    if (!record) {
      return new Response(
        JSON.stringify({ error: 'No record data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client for data queries (service_role to bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ============================================================
    // BILLING / CLIENT DATA — always sent, always from billing info
    // ============================================================
    // The "client data" in the contract is always the billing data
    // (whether it's the same person, another person, or a company).

    let clientAddress = '';
    let clientFullName = record.client_full_name || '';
    let billingType = 'personal';
    let billingName = '';
    let billingNif = '';
    let billingPhone = '';
    let billingEmail = '';
    let billingAddress = '';

    if (record.client_id) {
      // Fetch client name + surname (always from clients table)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name, surname, address, address_number, city, autonomous_community, country')
        .eq('id', record.client_id)
        .single();

      if (clientError) {
        console.error('Error fetching client data');
      } else if (clientData) {
        clientFullName = [clientData.name, clientData.surname].filter(Boolean).map(s => s.trim()).join(' ') || clientFullName;
        const parts = [
          [clientData.address, clientData.address_number].filter(Boolean).join(' '),
          clientData.city,
          clientData.autonomous_community,
          clientData.country
        ].filter(Boolean);
        clientAddress = parts.join(', ');
      }

      // Fetch billing data (type + details for company/other_person cases)
      const { data: billingData, error: billingError } = await supabase
        .from('billing')
        .select('type, name, surname, nif, phone, email, billing_address, address_street, city, autonomous_community, country, office_unit')
        .eq('client_id', record.client_id)
        .limit(1)
        .maybeSingle();

      if (billingError) {
        console.error('Error fetching billing data');
      } else if (billingData) {
        billingType = billingData.type || 'personal';
        billingNif = billingData.nif || '';
        billingPhone = billingData.phone || record.client_phone || '';
        billingEmail = billingData.email || record.client_email || '';

        if (billingType === 'company') {
          billingName = billingData.name || '';
          // Build company address
          const addrParts = [
            billingData.address_street || billingData.billing_address,
            billingData.office_unit,
            billingData.city,
            billingData.autonomous_community,
            billingData.country
          ].filter(Boolean).map(s => s.trim()).filter(Boolean);
          billingAddress = addrParts.join(', ');
        } else if (billingType === 'other_person') {
          billingName = [billingData.name, billingData.surname].filter(Boolean).map(s => s.trim()).join(' ');
          const addrParts = [
            billingData.address_street || billingData.billing_address,
            billingData.office_unit,
            billingData.city,
            billingData.autonomous_community,
            billingData.country
          ].filter(Boolean).map(s => s.trim()).filter(Boolean);
          billingAddress = addrParts.join(', ');
        }
      }
    }

    // ============================================================
    // VEHICLE DATA — only for compraventa_final
    // ============================================================
    let vehicleData = {
      modelo_nomade: '',
      engine: '',
      vin_number: '',
      plate_number: ''
    };

    if (record.contract_type === 'compraventa_final' && record.project_id) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('numero_bastidor, matricula, engine, exterior_color, transmission_type, plazas')
        .eq('project_id', record.project_id)
        .single();

      if (vehicleError) {
        console.error('Error fetching vehicle data');
      } else if (vehicle) {
        const modelParts = [];
        if (vehicle.exterior_color) modelParts.push(vehicle.exterior_color);
        if (vehicle.plazas) modelParts.push(`${vehicle.plazas} plazas`);

        vehicleData = {
          modelo_nomade: record.vehicle_model || modelParts.join(' - ') || 'Modelo no especificado',
          engine: record.vehicle_engine || vehicle.engine || '',
          vin_number: record.vehicle_vin || vehicle.numero_bastidor || '',
          plate_number: record.vehicle_plate || vehicle.matricula || ''
        };
      }
    }

    // ============================================================
    // BUDGET TOTAL — for encargo and compraventa_final
    // Uses total_with_iedmt which is pre-computed and stored in the budget table
    // ============================================================
    let budgetTotal = null;
    let formattedBudgetTotal = null;
    let budgetModelName = '';
    let budgetEngineName = '';
    if ((record.contract_type === 'encargo' || record.contract_type === 'compraventa_final') && record.project_id) {
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget')
        .select('total, total_with_iedmt, model_option:model_options(name), engine_option:engine_options(name)')
        .eq('client_id', record.client_id)
        .eq('is_primary', true)
        .single();

      if (budgetError) {
        console.error('Error fetching budget data:', budgetError.message);
      } else if (budgetData) {
        // Use total_with_iedmt (includes IEDMT), fallback to total
        const realTotal = budgetData.total_with_iedmt && Number(budgetData.total_with_iedmt) > 0
          ? Number(budgetData.total_with_iedmt)
          : Number(budgetData.total);
        budgetTotal = realTotal;
        formattedBudgetTotal = formatSpanishPrice(realTotal);
        budgetModelName = (budgetData.model_option as any)?.name || '';
        budgetEngineName = (budgetData.engine_option as any)?.name || '';
      }
    }

    // ============================================================
    // PAYMENT DATA FROM SIBLING CONTRACTS — for encargo & compraventa_final
    // ============================================================
    let reservaAmount = 0;
    let reservaDate = '';
    let encargoAmount = 0;
    let encargoDate = '';

    if ((record.contract_type === 'encargo' || record.contract_type === 'compraventa_final') && record.project_id) {
      // Fetch reserva payment + date from the latest reserva contract
      const { data: reservaData } = await supabase
        .from('contracts')
        .select('payment_reserve, created_at')
        .eq('project_id', record.project_id)
        .eq('contract_type', 'reserva')
        .eq('is_latest', true)
        .limit(1)
        .maybeSingle();

      if (reservaData?.payment_reserve) {
        reservaAmount = reservaData.payment_reserve;
      }
      if (reservaData?.created_at) {
        const d = new Date(reservaData.created_at);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        reservaDate = `${dd}/${mm}/${yy}`;
      }

      // Fetch encargo payment + date (needed for compraventa_final)
      if (record.contract_type === 'compraventa_final') {
        const { data: encargoData } = await supabase
          .from('contracts')
          .select('payment_first_amount, created_at')
          .eq('project_id', record.project_id)
          .eq('contract_type', 'encargo')
          .eq('is_latest', true)
          .limit(1)
          .maybeSingle();

        if (encargoData?.payment_first_amount) {
          encargoAmount = encargoData.payment_first_amount;
        }
        if (encargoData?.created_at) {
          const d = new Date(encargoData.created_at);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yy = String(d.getFullYear()).slice(-2);
          encargoDate = `${dd}/${mm}/${yy}`;
        }
      }
    }

    // ============================================================
    // GENERATE DATE + COMPRADOR BLOQUE
    // ============================================================
    const currentDate = new Date();
    const mesesES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const sentDate = `En Montcada i Reixac (Barcelona), a ${currentDate.getDate()} de ${mesesES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;

    // Generate dynamic comprador_bloque text based on billing type
    let compradorBloque = '';

    if (billingType === 'company') {
      // Client representing a company
      compradorBloque = `De otra parte, D./Dª. ${clientFullName}, mayor de edad, provista de D.N.I número ${record.client_dni || ''}, y domicilio en ${clientAddress}, en nombre y representación de la mercantil ${billingName}, con domicilio en ${billingAddress}, con C.I.F. ${billingNif}, teléfono: ${billingPhone}, e-mail: ${billingEmail}. En adelante EL COMPRADOR.`;
    } else if (billingType === 'other_person') {
      // Client representing another physical person
      compradorBloque = `De otra parte, D./Dª. ${clientFullName}, mayor de edad, provista de D.N.I número ${record.client_dni || ''}, y domicilio en ${clientAddress}, en nombre y representación de ${billingName}, con domicilio en ${billingAddress}, con D.N.I ${billingNif}, teléfono: ${billingPhone}, e-mail: ${billingEmail}. En adelante EL COMPRADOR.`;
    } else {
      // Direct client (personal)
      compradorBloque = `De otra parte, D./Dª. ${clientFullName}, mayor de edad, provista de D.N.I número ${record.client_dni || ''}, y domicilio en ${clientAddress}, teléfono: ${record.client_phone || ''}, e-mail: ${record.client_email || ''}. En adelante EL COMPRADOR.`;
    }

    // ============================================================
    // MAP CONTRACT TYPE for n8n
    // ============================================================
    const contractTypeMapping: Record<string, string> = {
      'reserva': 'reserva',
      'encargo': 'encargo',
      'compraventa_final': 'compraventa',
    };

    const mappedContractType = contractTypeMapping[record.contract_type] || record.contract_type;

    // ============================================================
    // BUILD DOCUSEAL PAYLOAD
    // ============================================================

    // Template ID selection (placeholder IDs — user will update with new DocuSeal templates)
    const templateId = record.contract_type === 'reserva' ? 452995 :
      record.contract_type === 'encargo' ? 453175 :
        453272; // compraventa_final

    // Submitter validation
    const submitterEmail = record.client_email || "firma@nomade-nation.com";
    const submitterName = clientFullName || "Cliente";
    const submitterPhone = record.client_phone || "";

    if (!submitterEmail || submitterEmail.trim() === '' ||
      !submitterName || submitterName.trim() === '') {
      throw new Error(`Missing required submitter data: email='${submitterEmail}', name='${submitterName}'`);
    }

    // === Common fields for ALL contract types ===
    // Only fields that exist in the DocuSeal template
    const commonFields = [
      { name: "comprador_bloque", value: compradorBloque, readonly: true },
      { name: "fecha_envio", value: sentDate, readonly: true },
    ];

    // === Contract-type-specific fields ===
    let specificFields: Array<{ name: string; value: string; readonly: boolean }> = [];

    if (record.contract_type === 'reserva') {
      specificFields = [
        { name: "reserva", value: formatSpanishPrice(record.payment_reserve || 0), readonly: true },
      ];
    } else if (record.contract_type === 'encargo') {
      specificFields = [
        { name: "precio_total", value: formattedBudgetTotal || '0,00', readonly: true },
        { name: "reserva", value: formatSpanishPrice(reservaAmount), readonly: true },
        { name: "fecha_reserva", value: reservaDate || 'N/A', readonly: true },
        { name: "primer_pago", value: formatSpanishPrice(record.payment_first_amount || 0), readonly: true },
      ];
    } else if (record.contract_type === 'compraventa_final') {
      const totalPrice = budgetTotal || 0;
      // anticipo = encargo's primer_pago + compraventa payment (payment_last_manual)
      const compraventaPayment = record.payment_last_manual || 0;
      const anticipo = Number(compraventaPayment) + Number(encargoAmount);
      // pago_final = precio_total - reserva - anticipo
      const pagoFinal = Math.max(0, Number(totalPrice) - Number(reservaAmount) - anticipo);

      specificFields = [
        { name: "modelo", value: budgetModelName || '–', readonly: true },
        { name: "motor", value: budgetEngineName || '–', readonly: true },
        { name: "bastidor", value: record.vehicle_vin || '', readonly: true },
        { name: "matricula", value: record.vehicle_plate || '', readonly: true },
        { name: "precio_total", value: formattedBudgetTotal || '0,00', readonly: true },
        { name: "reserva", value: formatSpanishPrice(reservaAmount), readonly: true },
        { name: "fecha_reserva", value: reservaDate || 'N/A', readonly: true },
        { name: "anticipo", value: formatSpanishPrice(anticipo), readonly: true },
        { name: "pago_final", value: formatSpanishPrice(pagoFinal), readonly: true },
        { name: "fecha_encargo", value: encargoDate || 'N/A', readonly: true },
      ];
    }

    const docuSealPayload = {
      template_id: templateId,
      submitters: [
        {
          email: submitterEmail.trim(),
          name: submitterName.trim(),
          role: record.contract_type === 'reserva' ? 'First Party' : 'Primera Parte',
          fields: [...commonFields, ...specificFields]
        }
      ]
    };

    // ============================================================
    // SEND TO N8N
    // ============================================================
    const n8nWebhookUrl = Deno.env.get('N8N_CONTRACT_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      throw new Error('N8N_CONTRACT_WEBHOOK_URL environment variable is not set');
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': Deno.env.get('N8N_WEBHOOK_SECRET') || '',
      },
      body: JSON.stringify({
        ...docuSealPayload,
        _sender_email: senderEmail || record.sender_email || '',
        _contract_id: record.id || '',
        _contract_type: mappedContractType,
        _budget_pdf_url: record.budget_pdf_url || '',
      }),
    });

    if (!n8nResponse.ok) {
      console.error('Error sending to n8n:', n8nResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to send to n8n' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Contract webhook processed for ${record.contract_type}`,
        contract_type: mappedContractType,
        fields_sent: [...commonFields, ...specificFields].map(f => f.name)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in contract webhook');
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
