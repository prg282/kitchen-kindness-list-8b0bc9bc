-- Add quantity column to grocery_items table
ALTER TABLE public.grocery_items 
ADD COLUMN quantity text DEFAULT NULL;

-- Add quantity column to known_items table for remembering quantities
ALTER TABLE public.known_items 
ADD COLUMN default_quantity text DEFAULT NULL;