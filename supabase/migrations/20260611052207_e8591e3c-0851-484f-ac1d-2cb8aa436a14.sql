
ALTER TABLE public.households ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Backfill: earliest profile per household becomes owner
UPDATE public.households h
SET owner_id = sub.id
FROM (
  SELECT DISTINCT ON (household_id) household_id, id
  FROM public.profiles
  WHERE household_id IS NOT NULL
  ORDER BY household_id, created_at ASC
) sub
WHERE h.id = sub.household_id AND h.owner_id IS NULL;

-- Helper: is the caller the owner of a given household?
CREATE OR REPLACE FUNCTION public.is_household_owner(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.households
    WHERE id = _household_id AND owner_id = _user_id
  )
$$;

-- Replace handle_new_user to set owner_id when creating a fresh household
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
  meta_household_id UUID;
BEGIN
  BEGIN
    meta_household_id := NULLIF(NEW.raw_user_meta_data ->> 'join_household_id', '')::uuid;
  EXCEPTION WHEN others THEN
    meta_household_id := NULL;
  END;

  IF meta_household_id IS NOT NULL THEN
    new_household_id := meta_household_id;
  ELSE
    INSERT INTO public.households (name, owner_id) VALUES ('My Household', NEW.id) RETURNING id INTO new_household_id;
  END IF;

  INSERT INTO public.profiles (id, email, display_name, household_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    new_household_id
  );

  RETURN NEW;
END;
$$;

-- Update the profile-protection trigger so the household owner can move a member out
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_premium := OLD.is_premium;

  IF OLD.household_id IS DISTINCT FROM NEW.household_id THEN
    -- Allow change if:
    --  * setting from NULL to a value (joining), OR
    --  * the caller is the owner of the OLD household (removing a member), OR
    --  * the user is changing their own household to a household they own (e.g. switching to a new one they created)
    IF OLD.household_id IS NOT NULL
       AND NOT public.is_household_owner(auth.uid(), OLD.household_id)
       AND NOT (auth.uid() = NEW.id AND NEW.household_id IS NOT NULL AND public.is_household_owner(auth.uid(), NEW.household_id))
    THEN
      NEW.household_id := OLD.household_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Allow household owners to update other members' profiles (to clear household_id)
CREATE POLICY "Household owners can update member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  household_id IS NOT NULL
  AND public.is_household_owner(auth.uid(), household_id)
)
WITH CHECK (true);
