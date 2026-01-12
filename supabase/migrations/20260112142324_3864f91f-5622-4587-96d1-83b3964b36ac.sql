-- Fix the overly permissive households INSERT policy
DROP POLICY "Anyone can create a household" ON public.households;

-- Only the trigger function (security definer) creates households, not users directly
-- Users can only create households through the signup process