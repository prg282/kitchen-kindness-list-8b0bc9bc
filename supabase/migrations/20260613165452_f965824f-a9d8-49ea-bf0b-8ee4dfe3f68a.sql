GRANT EXECUTE ON FUNCTION public.get_user_household(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_household_owner(uuid, uuid) TO authenticated;