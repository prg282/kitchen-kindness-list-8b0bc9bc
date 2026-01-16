-- Disable RLS on rate_limits table since it's only accessed by edge functions with service role key
-- Service role bypasses RLS anyway, but having RLS enabled with no policies breaks client-level access patterns
ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on invite_failed_attempts for the same reason - only accessed by edge functions
ALTER TABLE public.invite_failed_attempts DISABLE ROW LEVEL SECURITY;