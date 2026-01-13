-- Create household invitations table
CREATE TABLE public.household_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for invitations
CREATE POLICY "Household members can create invitations"
ON public.household_invitations
FOR INSERT
WITH CHECK (household_id IN (
  SELECT profiles.household_id FROM profiles WHERE profiles.id = auth.uid()
));

CREATE POLICY "Household members can view their invitations"
ON public.household_invitations
FOR SELECT
USING (household_id IN (
  SELECT profiles.household_id FROM profiles WHERE profiles.id = auth.uid()
));

-- Anyone authenticated can view invitation by code (for accepting)
CREATE POLICY "Authenticated users can view invitation by code"
ON public.household_invitations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow updating used_by and used_at when accepting
CREATE POLICY "Authenticated users can accept invitations"
ON public.household_invitations
FOR UPDATE
USING (auth.uid() IS NOT NULL AND used_by IS NULL)
WITH CHECK (auth.uid() IS NOT NULL);