import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    const { incident } = await req.json();

    // Transform incident data to flat structure for n8n
    // Extract only the concepts from the description (remove the prefix)
    let cleanDescription = incident.description;
    if (incident.description && incident.description.includes('concepto(s): ')) {
      cleanDescription = incident.description.split('concepto(s): ')[1] || incident.description;
    }

    // Construct the direct URL to the incident
    const appUrl = Deno.env.get('APP_URL') || '';
    const incidentUrl = `${appUrl}/proyectos/${incident.project?.id}?tab=incidencias&incident=${incident.id}`;

    const flatData = {
      title: incident.reference_number,
      description: cleanDescription,
      status: incident.status?.label,
      project_code: incident.project?.project_code,
      created_by: incident.project?.client?.name,
      incident_id: incident.id,
      project_id: incident.project?.id,
      incident_url: incidentUrl
    };

    // Sending notification to n8n

    // Send to n8n webhook
    const n8nWebhookUrl = Deno.env.get('N8N_INCIDENT_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      throw new Error('N8N_INCIDENT_WEBHOOK_URL environment variable is not set');
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flatData),
    });

    if (!n8nResponse.ok) {
      console.error('n8n webhook error:', n8nResponse.status);
      throw new Error(`n8n webhook error: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    // n8n notification sent successfully

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent to n8n' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error sending n8n notification');
    return new Response(
      JSON.stringify({
        error: 'Failed to send n8n notification',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});