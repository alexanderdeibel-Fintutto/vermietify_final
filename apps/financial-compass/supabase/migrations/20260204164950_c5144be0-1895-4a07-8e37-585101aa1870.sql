-- Drop the existing INSERT policy for companies
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Create a better INSERT policy that works correctly
CREATE POLICY "Users can create companies"
ON public.companies
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

-- Create a function to automatically add the creator as company member
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-add creator as member
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();