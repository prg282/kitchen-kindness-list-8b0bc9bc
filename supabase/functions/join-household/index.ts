import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteCode, pin, displayName } = await req.json();
    
    console.log('Join household request received:', { inviteCode, pin: '***', displayName });

    if (!inviteCode || !pin) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Invite code and PIN are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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