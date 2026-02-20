import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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
        const { data: { user: callerUser }, error: authError } = await supabaseAuth.auth.getUser(
            authHeader.replace('Bearer ', '')
        );
        if (authError || !callerUser) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // === ROLE CHECK: Only admin/ceo can invite users ===
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: callerProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, department')
            .eq('user_id', callerUser.id)
            .maybeSingle();

        const callerRole = callerProfile?.role || callerUser.user_metadata?.role;
        const callerDept = callerProfile?.department || callerUser.user_metadata?.department;
        const isAuthorized = callerRole === 'admin' || callerRole === 'ceo' || callerDept === 'Dirección';

        if (!isAuthorized) {
            return new Response(
                JSON.stringify({ error: 'Insufficient permissions. Only admins can invite users.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { email, name, department, role } = await req.json();

        // Validate required fields
        if (!email || !name || !department || !role) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // supabaseAdmin already initialized above with service role key

        // 1. Send invitation
        // Sending invitation via Supabase Auth
        let inviteData: Record<string, any> | null = null;
        let inviteError: { message: string; status?: number } | null = null;

        const { data: resData, error: resError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { name, department, role },
            redirectTo: `${req.headers.get('origin') || Deno.env.get('APP_URL') || ''}/intro`,
        });

        inviteData = resData;
        inviteError = resError;

        if (inviteError) {
            console.warn('Invite notice:', inviteError.message);

            // If user already exists, we attempt to find their user_id to still perform the profile upsert/update
            if (inviteError.message.toLowerCase().includes('already registered') ||
                inviteError.message.toLowerCase().includes('already exists') ||
                inviteError.status === 422) {

                // User already exists, finding existing user_id

                // Try finding in user_profiles first
                const { data: profile } = await supabaseAdmin
                    .from('user_profiles')
                    .select('user_id')
                    .eq('email', email)
                    .maybeSingle();

                if (profile?.user_id) {
                    inviteData = { user: { id: profile.user_id } };
                    inviteError = null;
                } else {
                    // Fallback to searching in all users
                    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                    const existingUser = users?.find((u: { email?: string }) => u.email === email);

                    if (existingUser) {
                        // Found existing user from auth list
                        inviteData = { user: existingUser };
                        inviteError = null;
                    } else if (listError) {
                        throw new Error(`User exists but listUsers failed: ${listError.message}`);
                    } else {
                        throw new Error(`Auth said user exists but we couldn't find them for email: ${email}`);
                    }
                }
            } else {
                throw inviteError;
            }
        }

        // 2. Add/Update to user_profiles table (linking to the auth user)
        // Syncing profile to database
        const { error: dbError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
                user_id: inviteData.user.id,
                email,
                name,
                department
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('Database error during upsert:', dbError.code);
            return new Response(
                JSON.stringify({
                    error: 'Database error while recording profile',
                    details: dbError.message,
                    code: dbError.code,
                    hint: dbError.hint
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        // Invitation and profile sync completed successfully
        return new Response(
            JSON.stringify({ message: 'Invitación enviada correctamente', user: inviteData.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: unknown) {
        console.error('Error in invite-user function');
        return new Response(
            JSON.stringify({
                error: 'Internal Server Error',
                message: (error as Error).message,
                details: (error as Error).message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
