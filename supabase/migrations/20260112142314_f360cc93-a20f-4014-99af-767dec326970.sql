-- Create households table for family groups
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Household',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table linked to households
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grocery_items table linked to households
CREATE TABLE public.grocery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  checked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create known_items table for reusable suggestions per household
CREATE TABLE public.known_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(household_id, name)
);

-- Enable RLS on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_items ENABLE ROW LEVEL SECURITY;

-- Households policies
CREATE POLICY "Users can view their own household"
  ON public.households FOR SELECT
  USING (id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own household"
  ON public.households FOR UPDATE
  USING (id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Anyone can create a household"
  ON public.households FOR INSERT
  WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view profiles in their household"
  ON public.profiles FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Grocery items policies (household members can manage)
CREATE POLICY "Household members can view grocery items"
  ON public.grocery_items FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can insert grocery items"
  ON public.grocery_items FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can update grocery items"
  ON public.grocery_items FOR UPDATE
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can delete grocery items"
  ON public.grocery_items FOR DELETE
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

-- Known items policies
CREATE POLICY "Household members can view known items"
  ON public.known_items FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can insert known items"
  ON public.known_items FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Household members can update known items"
  ON public.known_items FOR UPDATE
  USING (household_id IN (SELECT household_id FROM public.profiles WHERE id = auth.uid()));

-- Enable realtime for grocery_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_items;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create a new household for the user
  INSERT INTO public.households (name) VALUES ('My Household') RETURNING id INTO new_household_id;
  
  -- Create profile linked to the household
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

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for grocery items timestamp
CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON public.grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();