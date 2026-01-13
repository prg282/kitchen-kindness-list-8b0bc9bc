-- Add PIN column to household_invitations
ALTER TABLE public.household_invitations
ADD COLUMN pin TEXT NOT NULL DEFAULT substring(md5(random()::text) from 1 for 6);