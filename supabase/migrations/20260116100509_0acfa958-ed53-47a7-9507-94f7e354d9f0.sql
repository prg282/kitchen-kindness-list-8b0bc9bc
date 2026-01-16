-- Add database-level length constraints to prevent oversized inputs and storage exhaustion

-- Grocery items constraints
ALTER TABLE public.grocery_items ADD CONSTRAINT grocery_item_name_length CHECK (char_length(name) <= 200);
ALTER TABLE public.grocery_items ADD CONSTRAINT grocery_item_quantity_length CHECK (quantity IS NULL OR char_length(quantity) <= 50);

-- Households constraint
ALTER TABLE public.households ADD CONSTRAINT household_name_length CHECK (char_length(name) <= 100 AND char_length(name) >= 1);

-- Known items constraint
ALTER TABLE public.known_items ADD CONSTRAINT known_item_name_length CHECK (char_length(name) <= 200);

-- Profiles constraint
ALTER TABLE public.profiles ADD CONSTRAINT display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 100);