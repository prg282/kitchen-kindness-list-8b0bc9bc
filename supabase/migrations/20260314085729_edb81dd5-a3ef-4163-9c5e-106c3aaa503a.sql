
-- 1. Enable RLS on rate_limits (currently disabled, exposes IP addresses)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Only service_role can access rate_limits (edge functions use service role)
-- No policies needed = no public access

-- 2. Enable RLS on invite_failed_attempts (currently disabled, exposes invite codes)
ALTER TABLE public.invite_failed_attempts ENABLE ROW LEVEL SECURITY;
-- Only service_role can access invite_failed_attempts
-- No policies needed = no public access

-- 3. Fix household_invitations policies - remove overly permissive SELECT/UPDATE

-- Drop the permissive SELECT policy that exposes all invitation codes/PINs
DROP POLICY IF EXISTS "Users can view valid invitations for acceptance" ON public.household_invitations;

-- Drop the permissive UPDATE policy that lets anyone accept any invitation
DROP POLICY IF EXISTS "Authenticated users can accept invitations" ON public.household_invitations;

-- Note: Invitation acceptance is handled by the edge function using service_role key,
-- so no public UPDATE policy is needed. The edge function validates invite_code + PIN server-side.

-- 4. Enable leaked password protection
ALTER TABLE public.household_invitations FORCE ROW LEVEL SECURITY;
