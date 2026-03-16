-- Drop the restrictive policy and create a permissive one
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);