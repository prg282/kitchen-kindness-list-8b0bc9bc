-- Create a rate limiting table to track attempts
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, action)
);

-- Enable RLS but allow edge functions with service role to bypass
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access this table
-- (Edge functions use service role key)

-- Create an index for efficient lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(identifier, action, first_attempt_at);

-- Create a function to clean up old rate limit entries (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE first_attempt_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a table to track failed PIN attempts per invite code
CREATE TABLE public.invite_failed_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code TEXT NOT NULL UNIQUE,
  failed_count INTEGER NOT NULL DEFAULT 1,
  first_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - only service role access
ALTER TABLE public.invite_failed_attempts ENABLE ROW LEVEL SECURITY;

-- Create index for lookups
CREATE INDEX idx_invite_failed_attempts_code ON public.invite_failed_attempts(invite_code);