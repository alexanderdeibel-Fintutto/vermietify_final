
-- Add is_personal flag to companies table
ALTER TABLE public.companies ADD COLUMN is_personal boolean NOT NULL DEFAULT false;

-- Create index for quick lookup
CREATE INDEX idx_companies_is_personal ON public.companies (is_personal) WHERE is_personal = true;

-- Update handle_new_user to also create a personal company + membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  personal_company_id uuid;
  display_name text;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  -- Determine display name
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create personal company
  personal_company_id := gen_random_uuid();
  INSERT INTO public.companies (id, name, is_personal)
  VALUES (personal_company_id, display_name || ' – Privat', true);

  -- Add user as owner of personal company
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (personal_company_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

-- RLS: Prevent deletion of personal companies
CREATE POLICY "Cannot delete personal companies"
ON public.companies
FOR DELETE
USING (is_personal = false AND is_company_member(id));
