CREATE OR REPLACE FUNCTION public.admin_assign_household(p_user_id uuid, p_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only callable by service_role (edge functions)
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only service role can assign households';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.households WHERE id = p_household_id) THEN
    RAISE EXCEPTION 'Household does not exist';
  END IF;

  UPDATE public.profiles SET household_id = p_household_id WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_assign_household(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_household(uuid, uuid) TO service_role;