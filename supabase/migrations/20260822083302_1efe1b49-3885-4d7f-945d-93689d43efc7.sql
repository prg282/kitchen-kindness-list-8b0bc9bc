ALTER TABLE public.grocery_items ADD COLUMN IF NOT EXISTS price numeric(10,2);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  item_id uuid,
  list_id uuid,
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  quantity text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS purchases_item_id_key ON public.purchases (item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS purchases_household_time_idx ON public.purchases (household_id, purchased_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view purchases"
ON public.purchases FOR SELECT TO authenticated
USING (household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household members can log purchases"
ON public.purchases FOR INSERT TO authenticated
WITH CHECK (household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household members can update purchases"
ON public.purchases FOR UPDATE TO authenticated
USING (household_id = private.get_user_household(auth.uid()))
WITH CHECK (household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household members can delete purchases"
ON public.purchases FOR DELETE TO authenticated
USING (household_id = private.get_user_household(auth.uid()));