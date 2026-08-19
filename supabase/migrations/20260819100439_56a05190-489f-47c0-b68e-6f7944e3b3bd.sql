CREATE OR REPLACE FUNCTION public.remove_household_member(_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.remove_household_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_household_member(uuid) TO authenticated;