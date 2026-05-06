
-- 1. Allow household_id to be set on a profile that has no household yet (initial join via invite),
--    but still prevent users from changing household_id or is_premium afterwards.
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- is_premium can never be changed by clients
  NEW.is_premium := OLD.is_premium;

  -- household_id is locked once it has been set; only allow setting from NULL -> value
  IF OLD.household_id IS NOT NULL THEN
    NEW.household_id := OLD.household_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Make sure the trigger exists on profiles
DROP TRIGGER IF EXISTS protect_profile_sensitive_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- 2. Update handle_new_user to honour a join_household_id passed via signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_household_id UUID;
  meta_household_id UUID;
BEGIN
  -- Try to read join_household_id from raw_user_meta_data
  BEGIN
    meta_household_id := NULLIF(NEW.raw_user_meta_data ->> 'join_household_id', '')::uuid;
  EXCEPTION WHEN others THEN
    meta_household_id := NULL;
  END;

  IF meta_household_id IS NOT NULL THEN
    new_household_id := meta_household_id;
  ELSE
    INSERT INTO public.households (name) VALUES ('My Household') RETURNING id INTO new_household_id;
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

-- 3. Loyalty cards table
CREATE TABLE public.loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  created_by UUID,
  name TEXT NOT NULL,
  card_number TEXT,
  barcode_value TEXT,
  barcode_format TEXT,
  photo_path TEXT,
  notes TEXT,
  brand_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_cards_household ON public.loyalty_cards(household_id);

ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view loyalty cards"
ON public.loyalty_cards FOR SELECT
USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can insert loyalty cards"
ON public.loyalty_cards FOR INSERT
WITH CHECK (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can update loyalty cards"
ON public.loyalty_cards FOR UPDATE
USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can delete loyalty cards"
ON public.loyalty_cards FOR DELETE
USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE TRIGGER update_loyalty_cards_updated_at
BEFORE UPDATE ON public.loyalty_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Storage bucket for loyalty card photos (public read for simplicity; paths include household id)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loyalty-card-photos', 'loyalty-card-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view loyalty card photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'loyalty-card-photos');

CREATE POLICY "Household members can upload loyalty card photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'loyalty-card-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT household_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Household members can update loyalty card photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'loyalty-card-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT household_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Household members can delete loyalty card photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'loyalty-card-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT household_id::text FROM public.profiles WHERE id = auth.uid()
  )
);
