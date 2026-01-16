-- Drop the overly permissive policy that exposes all invitation codes
DROP POLICY IF EXISTS "Authenticated users can view invitation by code" ON public.household_invitations;

-- Create a more restrictive policy that limits exposure
-- Only show unused, non-expired invitations to reduce enumeration attack surface
CREATE POLICY "Users can view valid invitations for acceptance"
ON public.household_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND used_by IS NULL 
  AND expires_at > now()
);