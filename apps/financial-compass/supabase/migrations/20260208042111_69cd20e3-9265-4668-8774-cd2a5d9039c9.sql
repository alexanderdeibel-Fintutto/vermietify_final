
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;

-- Recreate as PERMISSIVE policy so authenticated users can create companies
CREATE POLICY "Users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);
