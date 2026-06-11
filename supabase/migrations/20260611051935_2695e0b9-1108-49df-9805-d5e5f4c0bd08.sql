
CREATE OR REPLACE FUNCTION public.get_user_household(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE id = _user_id
$$;

CREATE POLICY "Household members can view each other"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  household_id IS NOT NULL
  AND household_id = public.get_user_household(auth.uid())
);
