-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;

-- Recreate as permissive policy (default)
CREATE POLICY "Users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);