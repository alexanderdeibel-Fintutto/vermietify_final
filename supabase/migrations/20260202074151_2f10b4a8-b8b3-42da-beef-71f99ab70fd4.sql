-- Fix 1: Prevent organization_id changes in profiles table
CREATE OR REPLACE FUNCTION public.prevent_organization_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only block if organization_id was already set and is being changed
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Cannot change organization_id once it has been assigned';
    END IF;
    RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS prevent_org_id_change ON public.profiles;
CREATE TRIGGER prevent_org_id_change
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_organization_id_change();

-- Fix 2: Restrict tenants table access to admins only
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tenants in their organization" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert tenants in their organization" ON public.tenants;
DROP POLICY IF EXISTS "Users can update tenants in their organization" ON public.tenants;
DROP POLICY IF EXISTS "Users can delete tenants in their organization" ON public.tenants;

-- Create new admin-only policies
CREATE POLICY "Admins can view tenants in their organization"
ON public.tenants
FOR SELECT
USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert tenants in their organization"
ON public.tenants
FOR INSERT
WITH CHECK (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update tenants in their organization"
ON public.tenants
FOR UPDATE
USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete tenants in their organization"
ON public.tenants
FOR DELETE
USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);