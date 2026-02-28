import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((o: string) => o.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  // Allow known domain patterns (vercel deployments + custom domain)
  const isTrustedDomain = origin.endsWith('.vercel.app') || origin.endsWith('.nomade-nation.com');
  const isExplicitlyAllowed = ALLOWED_ORIGINS.includes(origin);
  const allowedOrigin = (isLocalhost || isTrustedDomain || isExplicitlyAllowed) ? origin : (ALLOWED_ORIGINS[0] || '');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

interface SendBudgetEmailRequest {
  clientEmail: string;
  clientName: string;
  budgetCode: string;
  senderName: string;
  senderEmail: string;
  pdfBase64: string;
  totalFormatted: string;
  modelName: string;
  engineName: string;
  packName: string;
}

function buildEmailHtml(data: SendBudgetEmailRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Hero Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#2C3E50 0%,#34495E 50%,#4A5568 100%);padding:40px 48px;text-align:center;">
              <p style="color:#C59D5F;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">NOMADE NATION</p>
              <h1 style="color:#FFFFFF;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px;">Tu Presupuesto</h1>
              <p style="color:#94A3B8;font-size:14px;margin:8px 0 0 0;">${data.budgetCode}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 48px 0 48px;">
              <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0;">
                Hola <strong>${data.clientName.split(' ')[0] || data.clientName}</strong>,
              </p>
              <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:12px 0 0 0;">
                ¡Muchas gracias por tu interés en Nomade Nation! Adjunto encontrarás tu presupuesto personalizado con todos los detalles de tu camper.
              </p>
            </td>
          </tr>

          <!-- Budget Summary Card -->
          <tr>
            <td style="padding:24px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9FA;border-radius:12px;border:1px solid #E5E7EB;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Modelo</span><br>
                          <span style="color:#1A1A1A;font-size:15px;font-weight:600;">${data.modelName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Motor</span><br>
                          <span style="color:#1A1A1A;font-size:15px;font-weight:600;">${data.engineName}</span>
                        </td>
                      </tr>
                      ${data.packName && data.packName !== '–' ? `
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Pack</span><br>
                          <span style="color:#1A1A1A;font-size:15px;font-weight:600;">${data.packName}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
                <!-- Total -->
                <tr>
                  <td style="background:linear-gradient(135deg,#2C3E50,#34495E);padding:18px 28px;border-radius:0 0 11px 11px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#94A3B8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Total Presupuesto</td>
                        <td align="right" style="color:#C59D5F;font-size:24px;font-weight:800;">${data.totalFormatted} €</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PDF Notice -->
          <tr>
            <td style="padding:0 48px 16px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF9EF;border-radius:10px;border:1px solid #F5E6CC;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#92780A;font-size:14px;margin:0;line-height:1.5;">
                      📎 <strong>Tienes el presupuesto completo adjunto en PDF</strong> con toda la información detallada.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 48px 24px 48px;">
              <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0;">
                Si tienes cualquier duda o quieres hacer algún cambio, no dudes en responder directamente a este email. Estamos aquí para ayudarte a crear la camper de tus sueños.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 36px 48px;">
              <p style="color:#1A1A1A;font-size:14px;line-height:1.6;margin:0;">
                ¡Seguimos en contacto!<br>
                <strong>${data.senderName}</strong><br>
                <span style="color:#9CA3AF;font-size:13px;">Nomade Nation</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8F9FA;padding:24px 48px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="color:#9CA3AF;font-size:11px;margin:0;line-height:1.5;">
                Nomade Vans S.L. · CIF: B09622879<br>
                info@nomade-nation.com
              </p>
              <p style="color:#CBD5E1;font-size:10px;margin:8px 0 0 0;">
                © ${new Date().getFullYear()} Nomade Vans S.L. — Todos los derechos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

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

    const body: SendBudgetEmailRequest = await req.json();
    const { clientEmail, budgetCode, senderName, senderEmail, pdfBase64 } = body;

    if (!clientEmail || !budgetCode || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clientEmail, budgetCode, pdfBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build HTML email
    const emailHtml = buildEmailHtml(body);

    // Send via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resendPayload = {
      from: `${senderName} via Nomade <presupuestos@nomade-nation.com>`,
      to: [clientEmail],
      reply_to: senderEmail,
      subject: `Presupuesto ${budgetCode} — Nomade Nation`,
      html: emailHtml,
      attachments: [
        {
          filename: `Presupuesto_${budgetCode}.pdf`,
          content: pdfBase64,
          type: 'application/pdf',
        }
      ]
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(resendData.message || 'Failed to send email via Resend');
    }

    console.log('✅ Budget email sent successfully:', resendData.id);

    return new Response(JSON.stringify({
      success: true,
      message: `Presupuesto enviado a ${clientEmail}`,
      emailId: resendData.id,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error('Error in send-budget-email function:', (error as Error).message);
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
