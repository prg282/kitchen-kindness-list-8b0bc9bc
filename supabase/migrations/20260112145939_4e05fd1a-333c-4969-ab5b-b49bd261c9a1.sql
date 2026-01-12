-- Drop the problematic recursive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles in their household" ON public.profiles;

-- Create a simple policy: users can read their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());