
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((o: string) => o.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

interface SendContractEmailRequest {
  contractId: string;
  clientEmail: string;
  clientName: string;
  projectCode: string;
  pdfUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contractId, clientEmail, clientName, projectCode, pdfUrl }: SendContractEmailRequest = await req.json();

    // In a real implementation, you would integrate with Resend or similar email service
    // For now, we'll simulate the email sending and update the contract status

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Email sent successfully (simulated)

    // Update contract status to 'sent'
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('❌ Error updating contract status:', updateError);
      throw updateError;
    }

    // Contract status updated to sent

    return new Response(JSON.stringify({
      success: true,
      message: `Contract sent to ${clientEmail}`,
      contractId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: unknown) {
    console.error('Error in send-contract-email function');
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
