-- Recreate the INSERT policy with simpler check
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
CREATE POLICY "Users can create companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);