-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
DROP FUNCTION IF EXISTS public.handle_new_company();

-- Recreate function with SECURITY DEFINER to run with elevated privileges
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

-- Recreate trigger
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();