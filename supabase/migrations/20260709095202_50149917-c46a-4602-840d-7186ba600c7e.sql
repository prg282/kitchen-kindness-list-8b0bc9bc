ALTER TABLE public.grocery_items ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.grocery_items ADD CONSTRAINT grocery_item_notes_length CHECK (notes IS NULL OR char_length(notes) <= 300);
ALTER TABLE public.known_items ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.known_items ADD COLUMN IF NOT EXISTS avg_days_between numeric;
ALTER TABLE public.known_items ADD COLUMN IF NOT EXISTS last_purchased_at timestamptz;
ALTER TABLE public.known_items ADD CONSTRAINT known_item_notes_length CHECK (notes IS NULL OR char_length(notes) <= 300);