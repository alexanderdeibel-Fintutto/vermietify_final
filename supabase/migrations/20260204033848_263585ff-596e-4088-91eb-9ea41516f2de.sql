-- Add organization type to distinguish personal from business organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add onboarding_completed flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_owner_user_id ON public.organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_is_personal ON public.organizations(is_personal);

-- Function to create personal organization for a user
CREATE OR REPLACE FUNCTION public.create_personal_organization(
  _user_id UUID,
  _first_name TEXT DEFAULT NULL,
  _last_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _org_name TEXT;
BEGIN
  -- Generate organization name from user name or default
  _org_name := COALESCE(
    NULLIF(TRIM(COALESCE(_first_name, '') || ' ' || COALESCE(_last_name, '')), ''),
    'Meine Immobilien'
  );
  
  -- Create the personal organization
  INSERT INTO public.organizations (name, is_personal, owner_user_id)
  VALUES (_org_name, true, _user_id)
  RETURNING id INTO _org_id;
  
  -- Update profile with organization_id
  UPDATE public.profiles
  SET organization_id = _org_id
  WHERE user_id = _user_id;
  
  -- Create admin role for user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN _org_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_personal_organization TO authenticated;

-- Update RLS policy for organizations to allow creating personal orgs
DROP POLICY IF EXISTS "Users can create first organization" ON public.organizations;

CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow creating personal org if user doesn't have one yet
  (is_personal = true AND owner_user_id = auth.uid() AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  ))
  OR
  -- Allow creating business org if user doesn't have one
  (is_personal = false AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  ))
);