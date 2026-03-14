
-- Fix profiles UPDATE policy to restrict which columns users can modify
-- Users should NOT be able to change is_premium or household_id directly

-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a restricted update policy using a trigger to prevent sensitive column changes
-- First, create a trigger function that prevents users from modifying sensitive columns
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Preserve sensitive columns - users cannot change these
  NEW.is_premium := OLD.is_premium;
  NEW.household_id := OLD.household_id;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;
CREATE TRIGGER protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- Re-create the update policy (same as before, but now protected by trigger)
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
