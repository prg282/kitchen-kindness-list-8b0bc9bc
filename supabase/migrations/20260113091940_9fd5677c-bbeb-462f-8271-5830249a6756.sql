-- Add INSERT policy for households table
CREATE POLICY "Authenticated users can create households"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (true);