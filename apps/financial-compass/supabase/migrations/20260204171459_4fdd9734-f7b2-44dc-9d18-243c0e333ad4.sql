-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;

-- Create a PERMISSIVE INSERT policy for authenticated users
CREATE POLICY "Users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);