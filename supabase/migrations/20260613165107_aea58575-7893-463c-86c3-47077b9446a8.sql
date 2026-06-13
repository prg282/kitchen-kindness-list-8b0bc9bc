
-- 1. Restrict household_invitations SELECT to creator only
DROP POLICY IF EXISTS "Household members can view their invitations" ON public.household_invitations;
CREATE POLICY "Invitation creators can view their invitations"
ON public.household_invitations
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- 2. Replace public read on loyalty-card-photos with a household-scoped policy
DROP POLICY IF EXISTS "Anyone can view loyalty card photos" ON storage.objects;
CREATE POLICY "Household members can view loyalty card photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'loyalty-card-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT (profiles.household_id)::text FROM public.profiles WHERE profiles.id = auth.uid()
  )
);

-- 3. Tighten owner-update-profiles policy: trigger still guards is_premium and
-- household_id, but the policy now also forbids moving rows into a household
-- the caller does not own.
DROP POLICY IF EXISTS "Household owners can update member profiles" ON public.profiles;
CREATE POLICY "Household owners can update member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (household_id IS NOT NULL AND public.is_household_owner(auth.uid(), household_id))
WITH CHECK (
  household_id IS NULL
  OR public.is_household_owner(auth.uid(), household_id)
);

-- 4. Lock down SECURITY DEFINER helper functions so they aren't exposed via
-- the Data API as RPCs. RLS policies still resolve them via the function
-- owner.
REVOKE EXECUTE ON FUNCTION public.get_user_household(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_household_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
