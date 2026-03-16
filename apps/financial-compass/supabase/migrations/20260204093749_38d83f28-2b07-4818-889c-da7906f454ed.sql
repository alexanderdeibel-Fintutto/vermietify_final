-- Fix security warnings

-- Update function search paths
CREATE OR REPLACE FUNCTION public.is_company_member(company_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = company_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix permissive company insert policy (require user to be authenticated)
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);