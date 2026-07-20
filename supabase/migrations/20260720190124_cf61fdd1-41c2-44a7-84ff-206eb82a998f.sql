
-- Lock down SECURITY DEFINER functions from public API roles.
-- Trigger/internal functions: no direct execute needed.
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_assign_household(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_sensitive_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- RLS helpers: revoke anon, keep authenticated so RLS policies work.
REVOKE ALL ON FUNCTION public.get_user_household(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_household(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_household_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_household_owner(uuid, uuid) TO authenticated;

-- RPC called by signed-in owners only.
REVOKE ALL ON FUNCTION public.remove_household_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_household_member(uuid) TO authenticated;
