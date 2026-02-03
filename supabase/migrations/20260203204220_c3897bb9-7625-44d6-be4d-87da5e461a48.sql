-- Drop existing admin-only policies on tenants table
DROP POLICY IF EXISTS "Admins can view tenants in their organization" ON public.tenants;
DROP POLICY IF EXISTS "Admins can insert tenants in their organization" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update tenants in their organization" ON public.tenants;
DROP POLICY IF EXISTS "Admins can delete tenants in their organization" ON public.tenants;

-- Create new organization-scoped policies for all members
CREATE POLICY "Users can view tenants in their organization"
ON public.tenants FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert tenants in their organization"
ON public.tenants FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update tenants in their organization"
ON public.tenants FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete tenants in their organization"
ON public.tenants FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()));