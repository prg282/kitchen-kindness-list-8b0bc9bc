-- 1. Grocery lists
CREATE TABLE public.grocery_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'shopping-cart',
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_lists TO authenticated;
GRANT ALL ON public.grocery_lists TO service_role;

ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view lists"
ON public.grocery_lists FOR SELECT TO authenticated
USING (household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household members can create lists"
ON public.grocery_lists FOR INSERT TO authenticated
WITH CHECK (household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household members can update lists"
ON public.grocery_lists FOR UPDATE TO authenticated
USING (household_id = private.get_user_household(auth.uid()))
WITH CHECK (household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household members can delete lists"
ON public.grocery_lists FOR DELETE TO authenticated
USING (household_id = private.get_user_household(auth.uid()) AND is_default = false);

CREATE TRIGGER update_grocery_lists_updated_at
BEFORE UPDATE ON public.grocery_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_grocery_lists_household ON public.grocery_lists(household_id);

-- 2. Item columns
ALTER TABLE public.grocery_items
  ADD COLUMN list_id UUID REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
  ADD COLUMN assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill: default list per household, move existing items into it
INSERT INTO public.grocery_lists (household_id, name, icon, is_default, sort_order)
SELECT id, 'Weekly Shopping', 'shopping-cart', true, 0 FROM public.households;

UPDATE public.grocery_items gi
SET list_id = gl.id
FROM public.grocery_lists gl
WHERE gl.household_id = gi.household_id AND gl.is_default = true AND gi.list_id IS NULL;

CREATE INDEX idx_grocery_items_list ON public.grocery_items(list_id);

-- 3. Activity feed
CREATE TABLE public.activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,
  item_name TEXT,
  list_name TEXT,
  target_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view activity"
ON public.activity_events FOR SELECT TO authenticated
USING (household_id = private.get_user_household(auth.uid()));

CREATE POLICY "Household members can log activity"
ON public.activity_events FOR INSERT TO authenticated
WITH CHECK (household_id = private.get_user_household(auth.uid()) AND actor_id = auth.uid());

CREATE INDEX idx_activity_events_household_created ON public.activity_events(household_id, created_at DESC);

-- Keep only the latest 50 events per household
CREATE OR REPLACE FUNCTION public.trim_activity_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.activity_events
  WHERE household_id = NEW.household_id
    AND id NOT IN (
      SELECT id FROM public.activity_events
      WHERE household_id = NEW.household_id
      ORDER BY created_at DESC
      LIMIT 50
    );
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.trim_activity_events() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trim_activity_events_trg
AFTER INSERT ON public.activity_events
FOR EACH ROW EXECUTE FUNCTION public.trim_activity_events();