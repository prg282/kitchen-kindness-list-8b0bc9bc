
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
CREATE POLICY "Authenticated users can create households"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());
