
-- Move RLS helper SECURITY DEFINER functions out of the exposed API schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- Recreate helpers inside private schema
CREATE OR REPLACE FUNCTION private.get_user_household(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT household_id FROM public.profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION private.is_household_owner(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.households WHERE id = _household_id AND owner_id = _user_id) $$;

REVOKE ALL ON FUNCTION private.get_user_household(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_household_owner(uuid, uuid) FROM PUBLIC;
-- Policies execute as the querying role; grant execute on the private helpers
GRANT EXECUTE ON FUNCTION private.get_user_household(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_household_owner(uuid, uuid) TO authenticated;

-- Recreate policies that reference the public helpers, pointing to private ones
DROP POLICY IF EXISTS "Household members can view each other" ON public.profiles;
DROP POLICY IF EXISTS "Household owners can update member profiles" ON public.profiles;

CREATE POLICY "Household members can view each other" ON public.profiles
FOR SELECT USING (household_id IS NOT NULL AND household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household owners can update member profiles" ON public.profiles
FOR UPDATE
USING (household_id IS NOT NULL AND private.is_household_owner(auth.uid(), household_id))
WITH CHECK (household_id IS NULL OR private.is_household_owner(auth.uid(), household_id));

-- Update the profile-protection trigger to use private helper
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.is_premium := OLD.is_premium;
  IF OLD.household_id IS DISTINCT FROM NEW.household_id THEN
    IF OLD.household_id IS NOT NULL
       AND NOT private.is_household_owner(auth.uid(), OLD.household_id)
       AND NOT (auth.uid() = NEW.id AND NEW.household_id IS NOT NULL AND private.is_household_owner(auth.uid(), NEW.household_id))
    THEN
      NEW.household_id := OLD.household_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Rewrite remove_household_member as SECURITY INVOKER so it's not flagged;
-- rely on the "Household owners can update member profiles" RLS policy.
CREATE OR REPLACE FUNCTION public.remove_household_member(_member_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  _household_id uuid;
  _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT household_id INTO _household_id FROM public.profiles WHERE id = _member_id;
  IF _household_id IS NULL THEN RAISE EXCEPTION 'Member is not in any household'; END IF;
  IF NOT private.is_household_owner(_caller, _household_id) THEN
    RAISE EXCEPTION 'Only the household owner can remove members';
  END IF;
  IF _member_id = _caller THEN RAISE EXCEPTION 'Owner cannot remove themselves'; END IF;

  UPDATE public.profiles SET household_id = NULL WHERE id = _member_id;
END;
$$;

-- Drop the now-unused public helper functions (no longer referenced by policies)
DROP FUNCTION IF EXISTS public.get_user_household(uuid);
DROP FUNCTION IF EXISTS public.is_household_owner(uuid, uuid);

-- Ensure remaining SECURITY DEFINER functions in public are not executable by anon/authenticated
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_assign_household(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_sensitive_columns() FROM PUBLIC, anon, authenticated;
