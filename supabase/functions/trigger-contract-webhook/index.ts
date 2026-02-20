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
    // === AUTH: Verify JWT token ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Initialize Supabase client for data queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get client address from database
    let clientAddress = '';
    if (record.client_id) {
      // Fetching client address

      const { data: clientData, error: clientError } = await supabase
        .from('NEW_Clients')
        .select('address')
        .eq('id', record.client_id)
        .single();

      if (clientError) {
        console.error('Error fetching client address');
      } else if (clientData) {
        clientAddress = clientData.address || '';
        // Client address retrieved
      }
    }

    // Get vehicle information from database
    let vehicleData = {
      modelo_nomade: '',
      engine: '',
      vin_number: '',
      plate_number: ''
    };

    if (record.project_id) {
      // Fetching vehicle data

      const { data: vehicle, error: vehicleError } = await supabase
        .from('NEW_Vehicles')
        .select('numero_bastidor, matricula, engine, exterior_color, transmission_type, plazas')
        .eq('project_id', record.project_id)
        .single();

      if (vehicleError) {
        console.error('Error fetching vehicle data');
      } else if (vehicle) {
        // Build modelo_nomade from available vehicle data
        const modelParts = [];
        if (vehicle.exterior_color) modelParts.push(vehicle.exterior_color);
        if (vehicle.plazas) modelParts.push(`${vehicle.plazas} plazas`);

        vehicleData = {
          modelo_nomade: modelParts.join(' - ') || 'Modelo no especificado',
          engine: vehicle.engine || '',
          vin_number: vehicle.numero_bastidor || '',
          plate_number: vehicle.matricula || ''
        };

        // Vehicle data retrieved
      }
    }

    // Get budget total for compraventa contracts
    let budgetTotal = null;
    let formattedBudgetTotal = null;
    if ((record.contract_type === 'sale_contract' || record.contract_type === 'purchase_agreement') && record.project_id) {
      // Fetching budget total for compraventa contract

      const { data: budgetData, error: budgetError } = await supabase
        .from('NEW_Budget')
        .select('total')
        .eq('project_id', record.project_id)
        .eq('is_primary', true)
        .single();

      if (budgetError) {
        console.error('Error fetching budget data');
      } else if (budgetData) {
        budgetTotal = budgetData.total;
        formattedBudgetTotal = formatSpanishPrice(budgetData.total);
        // Budget total retrieved
      }
    }

    // Get payment data for purchase_agreement contracts
    let paymentData = {
      payment_first_percentage: null,
      payment_first_amount: null,
      payment_second_percentage: null,
      payment_second_amount: null,
      payment_third_percentage: null,
      payment_third_amount: null
    };

    if (record.contract_type === 'purchase_agreement') {
      // Processing payment data for purchase agreement

      paymentData = {
        payment_first_percentage: record.payment_first_percentage || 0,
        payment_first_amount: record.payment_first_amount ? formatSpanishPrice(record.payment_first_amount) : formatSpanishPrice(0),
        payment_second_percentage: record.payment_second_percentage || 0,
        payment_second_amount: record.payment_second_amount ? formatSpanishPrice(record.payment_second_amount) : formatSpanishPrice(0),
        payment_third_percentage: record.payment_third_percentage || 0,
        payment_third_amount: record.payment_third_amount ? formatSpanishPrice(record.payment_third_amount) : formatSpanishPrice(0)
      };

      // Payment data processed
    }

    // Generate current date in dd/mm/yy format for sent date
    const currentDate = new Date();
    const sentDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear().toString().slice(-2)}`;

    // Determine if it's a company (if billing_entity_name exists and is different from client name)
    const isCompany = record.billing_entity_name &&
      record.billing_entity_name.trim() !== '' &&
      record.billing_entity_name !== record.client_full_name;

    // Generate dynamic comprador_bloque text as a single continuous block
    let compradorBloque = '';

    if (isCompany) {
      // Company format as single block
      compradorBloque = `De otra parte, D./Dª. ${record.client_full_name || ''}, mayor de edad, provista de D.N.I número ${record.client_dni || ''}, y domicilio en ${clientAddress || ''}, en nombre y representación de la mercantil ${record.billing_entity_name || ''}, con domicilio en ${record.billing_address || ''}, con C.I.F. ${record.billing_entity_nif || ''}, teléfono: ${record.client_phone || ''}, e-mail: ${record.client_email || ''}. En adelante EL COMPRADOR.`;
    } else {
      // Individual format as single block
      compradorBloque = `De otra parte, D./Dª. ${record.client_full_name || ''}, mayor de edad, provista de D.N.I número ${record.client_dni || ''}, y domicilio en ${clientAddress || ''}, teléfono: ${record.client_phone || ''}, e-mail: ${record.client_email || ''}. En adelante EL COMPRADOR.`;
    }


    // Map contract types to Spanish values expected by n8n
    const contractTypeMapping = {
      'reservation': 'reserva',
      'sale_contract': 'compraventa',
      'purchase_agreement': 'compraventa'
    };

    const mappedContractType = contractTypeMapping[record.contract_type] || record.contract_type;

    // Prepare data for n8n with all required fields
    const docuSealData = {
      // Required: contract type for n8n to select correct template
      contract_type: mappedContractType,

      // Essential client information for DocuSeal submitters
      client_name: record.client_full_name,
      client_email: record.client_email,
      client_dni: record.client_dni,
      client_phone: record.client_phone,

      // Complete formatted text block for PDF template
      comprador_bloque: compradorBloque,

      // Contract specific data
      fecha_envio: sentDate,
      importe_reserva: record.payment_reserve || 0,
      iban: record.iban || Deno.env.get('DEFAULT_IBAN') || '',

      // Vehicle information
      modelo_nomade: vehicleData.modelo_nomade,
      engine: vehicleData.engine,
      vin_number: vehicleData.vin_number,
      plate_number: vehicleData.plate_number,

      // Billing information for companies
      billing_entity_name: record.billing_entity_name,
      billing_address: record.billing_address,
      billing_entity_nif: record.billing_entity_nif
    };

    // Add formatted budget_total for compraventa contracts
    if (mappedContractType === 'compraventa' && budgetTotal !== null) {
      docuSealData.budget_total = formattedBudgetTotal;
      // Budget total added for compraventa
    }

    // Add payment data for purchase_agreement contracts
    if (record.contract_type === 'purchase_agreement') {
      docuSealData.payment_first_percentage = paymentData.payment_first_percentage;
      docuSealData.payment_first_amount = paymentData.payment_first_amount;
      docuSealData.payment_second_percentage = paymentData.payment_second_percentage;
      docuSealData.payment_second_amount = paymentData.payment_second_amount;
      docuSealData.payment_third_percentage = paymentData.payment_third_percentage;
      docuSealData.payment_third_amount = paymentData.payment_third_amount;

      // Payment data added for purchase agreement
    }

    // Build DocuSeal JSON structure for n8n
    const templateId = record.contract_type === 'reservation' ? 206669 :
      record.contract_type === 'purchase_agreement' ? 208468 :
        206808; // default for sale_contract (compraventa)

    // Validar campos requeridos para DocuSeal
    const submitterEmail = record.client_email || "firma@nomade-nation.com";
    const submitterName = docuSealData.client_name || record.client_full_name || "Cliente";
    const submitterPhone = record.client_phone || "";

    // Submitter validated

    // Asegurar que tenemos campos válidos (no vacíos, no null, no undefined)
    if (!submitterEmail || submitterEmail.trim() === '' ||
      !submitterName || submitterName.trim() === '') {
      throw new Error(`Missing required submitter data: email='${submitterEmail}', name='${submitterName}'`);
    }

    const docuSealPayload = {
      template_id: templateId,
      submitters: [
        {
          email: submitterEmail.trim(),
          name: submitterName.trim(),
          role: "Primera Parte",
          fields: [
            {
              name: "comprador_bloque",
              value: docuSealData.comprador_bloque,
              readonly: true
            },
            {
              name: "modelo_nomade",
              value: docuSealData.modelo_nomade,
              readonly: true
            },
            {
              name: "engine",
              value: docuSealData.engine,
              readonly: true
            },
            {
              name: "vin_number",
              value: docuSealData.vin_number,
              readonly: true
            },
            {
              name: "plate_number",
              value: docuSealData.plate_number,
              readonly: true
            }
          ]
        }
      ]
    };

    // Add common fields to all contracts
    docuSealPayload.submitters[0].fields.push(
      {
        name: "fecha_envio",
        value: docuSealData.fecha_envio,
        readonly: true
      },
      {
        name: "client_name",
        value: docuSealData.client_name,
        readonly: true
      }
    );

    // Add contract-specific fields
    if (record.contract_type === 'reservation') {
      docuSealPayload.submitters[0].fields.push(
        {
          name: "importe_reserva",
          value: String(docuSealData.importe_reserva),
          readonly: true
        },
        {
          name: "iban",
          value: docuSealData.iban,
          readonly: true
        }
      );
    } else if (record.contract_type === 'purchase_agreement') {
      docuSealPayload.submitters[0].fields.push(
        {
          name: "budget_total",
          value: docuSealData.budget_total,
          readonly: true
        },
        {
          name: "iban",
          value: docuSealData.iban,
          readonly: true
        },
        {
          name: "payment_first_percentage",
          value: String(docuSealData.payment_first_percentage) + "%",
          readonly: true
        },
        {
          name: "payment_first_amount",
          value: docuSealData.payment_first_amount,
          readonly: true
        },
        {
          name: "payment_second_percentage",
          value: String(docuSealData.payment_second_percentage) + "%",
          readonly: true
        },
        {
          name: "payment_second_amount",
          value: docuSealData.payment_second_amount,
          readonly: true
        },
        {
          name: "payment_third_percentage",
          value: String(docuSealData.payment_third_percentage) + "%",
          readonly: true
        },
        {
          name: "payment_third_amount",
          value: docuSealData.payment_third_amount,
          readonly: true
        }
      );
    } else {
      // sale_contract (compraventa) - only required fields, no IBAN
      docuSealPayload.submitters[0].fields.push(
        {
          name: "budget_total",
          value: docuSealData.budget_total,
          readonly: true
        }
      );
    }

    // Sending DocuSeal structure to n8n

    // Send to n8n webhook
    const n8nWebhookUrl = Deno.env.get('N8N_CONTRACT_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      throw new Error('N8N_CONTRACT_WEBHOOK_URL environment variable is not set');
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(docuSealPayload),
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

    // Contract data sent to n8n successfully

    return new Response(
      JSON.stringify({
        success: true,
        message: `Contract webhook processed for ${record.contract_type} with all required fields`,
        contract_type: record.contract_type,
        fields_sent: Object.keys(docuSealData)
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
