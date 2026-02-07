-- Create a SECURITY DEFINER function to get building IDs for a user's organization
-- This bypasses RLS on the buildings table, breaking the circular dependency
CREATE OR REPLACE FUNCTION public.get_user_building_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id
  FROM buildings b
  WHERE b.organization_id = get_user_organization_id(_user_id);
$$;

-- Drop and recreate units policies to use the new function instead of querying buildings directly
DROP POLICY IF EXISTS "Users can view units in their buildings" ON public.units;
CREATE POLICY "Users can view units in their buildings"
  ON public.units FOR SELECT TO authenticated
  USING (building_id IN (SELECT get_user_building_ids(auth.uid())));

DROP POLICY IF EXISTS "Users can update units in their buildings" ON public.units;
CREATE POLICY "Users can update units in their buildings"
  ON public.units FOR UPDATE TO authenticated
  USING (building_id IN (SELECT get_user_building_ids(auth.uid())));

DROP POLICY IF EXISTS "Users can delete units in their buildings" ON public.units;
CREATE POLICY "Users can delete units in their buildings"
  ON public.units FOR DELETE TO authenticated
  USING (building_id IN (SELECT get_user_building_ids(auth.uid())));

DROP POLICY IF EXISTS "Users can insert units in their buildings" ON public.units;
CREATE POLICY "Users can insert units in their buildings"
  ON public.units FOR INSERT TO authenticated
  WITH CHECK (building_id IN (SELECT get_user_building_ids(auth.uid())));