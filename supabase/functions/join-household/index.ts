import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting constants
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_FAILED_PIN_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check IP-based rate limit
    const rateLimitCheck = await checkRateLimit(supabaseAdmin, clientIp, 'join-household');
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode.trim() : '';
    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 100) : '';
    
    console.log('Join household request received:', { inviteCode: inviteCode.substring(0, 8) + '...', pin: '***', displayName: displayName ? '***' : '(none)', clientIp: clientIp.substring(0, 8) + '...' });

    // Validate invite code: must be a 32-character hex string
    if (!inviteCode || !/^[a-f0-9]{32}$/.test(inviteCode)) {
      console.error('Invalid invite code format');
      return new Response(
        JSON.stringify({ error: 'Invalid invitation link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate PIN: must be a 6-character alphanumeric string
    if (!pin || !/^[a-f0-9]{6}$/.test(pin)) {
      console.error('Invalid PIN format');
      return new Response(
        JSON.stringify({ error: 'PIN must be a 6-character code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate display name if provided
    if (displayName && (displayName.length < 1 || displayName.length > 100)) {
      return new Response(
        JSON.stringify({ error: 'Display name must be between 1 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invite code has too many failed PIN attempts
    const failedAttemptsCheck = await checkFailedAttempts(supabaseAdmin, inviteCode);
    if (!failedAttemptsCheck.allowed) {
      console.warn(`Invite code ${inviteCode.substring(0, 8)}... has been locked due to too many failed attempts`);
      return new Response(
        JSON.stringify({ error: 'This invitation has been locked due to too many failed attempts. Please request a new invitation.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch and validate invitation
    console.log('Fetching invitation...');
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('household_invitations')
      .select(`
        id,
        invite_code,
        pin,
        expires_at,
        used_by,
        household_id,
        households (
          id,
          name
        )
      `)
      .eq('invite_code', inviteCode)
      .single();

    if (inviteError || !invitation) {
      console.error('Invitation not found:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Invalid invitation link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate PIN
    if (invitation.pin !== pin) {
      console.error('Invalid PIN provided');
      // Record failed attempt
      await recordFailedPinAttempt(supabaseAdmin, inviteCode);
      return new Response(
        JSON.stringify({ error: 'Invalid PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already used
    if (invitation.used_by) {
      console.error('Invitation already used');
      return new Response(
        JSON.stringify({ error: 'This invitation has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      console.error('Invitation expired');
      return new Response(
        JSON.stringify({ error: 'This invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique email and password for auto-login
    const uniqueId = crypto.randomUUID().substring(0, 8);
    const generatedEmail = `guest_${uniqueId}@household.local`;
    const generatedPassword = crypto.randomUUID();
    const userName = displayName || `Guest ${uniqueId.substring(0, 4)}`;

    console.log('Creating user account...');

    // Create user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: generatedEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        display_name: userName,
      },
    });

    if (authError || !authData.user) {
      console.error('Failed to create user:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;
    console.log('User created:', userId);

    // Update profile to join household (trigger already created the profile, but we update household_id)
    console.log('Updating profile with household...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        household_id: invitation.household_id,
        display_name: userName,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      // Don't fail completely, user can still fix this
    }

    // Mark invitation as used
    console.log('Marking invitation as used...');
    const { error: updateError } = await supabaseAdmin
      .from('household_invitations')
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Failed to mark invitation as used:', updateError);
    }

    // Clean up failed attempts record for this invite code (successful join)
    await supabaseAdmin
      .from('invite_failed_attempts')
      .delete()
      .eq('invite_code', inviteCode);

    // Sign in the user to get session
    console.log('Signing in user...');
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: generatedEmail,
    });

    // Use signInWithPassword for immediate session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: sessionData, error: sessionError } = await supabaseClient.auth.signInWithPassword({
      email: generatedEmail,
      password: generatedPassword,
    });

    if (sessionError || !sessionData.session) {
      console.error('Failed to create session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Account created but failed to sign in. Please try signing in manually.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully joined household!');

    const household = Array.isArray(invitation.households) ? invitation.households[0] : invitation.households;

    return new Response(
      JSON.stringify({
        success: true,
        session: sessionData.session,
        user: sessionData.user,
        household: household,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Check IP-based rate limiting
async function checkRateLimit(supabase: any, identifier: string, action: string): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  
  try {
    // Check existing rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('attempt_count, first_attempt_at')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('first_attempt_at', windowStart)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Rate limit check error:', fetchError);
      // Allow on error to prevent blocking legitimate users
      return { allowed: true };
    }

    if (existing) {
      // Check if within limit
      if (existing.attempt_count >= MAX_REQUESTS_PER_HOUR) {
        return { allowed: false };
      }
      
      // Increment counter
      await supabase
        .from('rate_limits')
        .update({ 
          attempt_count: existing.attempt_count + 1,
          last_attempt_at: new Date().toISOString()
        })
        .eq('identifier', identifier)
        .eq('action', action);
    } else {
      // Clean up old entries and create new record
      await supabase
        .from('rate_limits')
        .delete()
        .eq('identifier', identifier)
        .eq('action', action);
        
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          action,
          attempt_count: 1,
          first_attempt_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString()
        });
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Allow on error to prevent blocking legitimate users
    return { allowed: true };
  }
}

// Check failed PIN attempts for invite code
async function checkFailedAttempts(supabase: any, inviteCode: string): Promise<{ allowed: boolean }> {
  try {
    const { data: existing, error } = await supabase
      .from('invite_failed_attempts')
      .select('failed_count')
      .eq('invite_code', inviteCode)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed attempts check error:', error);
      return { allowed: true };
    }

    if (existing && existing.failed_count >= MAX_FAILED_PIN_ATTEMPTS) {
      return { allowed: false };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Failed attempts error:', error);
    return { allowed: true };
  }
}

// Record a failed PIN attempt
async function recordFailedPinAttempt(supabase: any, inviteCode: string): Promise<void> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('invite_failed_attempts')
      .select('failed_count')
      .eq('invite_code', inviteCode)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Record failed attempt fetch error:', fetchError);
      return;
    }

    if (existing) {
      await supabase
        .from('invite_failed_attempts')
        .update({ 
          failed_count: existing.failed_count + 1,
          last_failed_at: new Date().toISOString()
        })
        .eq('invite_code', inviteCode);
    } else {
      await supabase
        .from('invite_failed_attempts')
        .insert({
          invite_code: inviteCode,
          failed_count: 1,
          first_failed_at: new Date().toISOString(),
          last_failed_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Record failed attempt error:', error);
  }
}
