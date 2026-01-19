-- Add RLS policy to allow household members to delete known items
CREATE POLICY "Household members can delete known items" 
ON public.known_items 
FOR DELETE 
USING (household_id IN ( SELECT profiles.household_id
   FROM profiles
  WHERE (profiles.id = auth.uid())));