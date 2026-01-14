-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;

-- Create a new PERMISSIVE policy for inserting households
CREATE POLICY "Authenticated users can create households" 
ON public.households 
FOR INSERT 
TO authenticated
WITH CHECK (true);