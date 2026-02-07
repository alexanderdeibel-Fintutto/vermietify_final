
-- Create a security definer function to check tenant access without RLS recursion
CREATE OR REPLACE FUNCTION public.get_tenant_ids_for_user(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tenant_id
  FROM tenant_unit_access
  WHERE tenant_user_id = _user_id;
$$;

-- Create a security definer function to check if a tenant belongs to user's organization
CREATE OR REPLACE FUNCTION public.tenant_in_user_org(_tenant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenants t
    WHERE t.id = _tenant_id
      AND t.organization_id = get_user_organization_id(_user_id)
  );
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Tenants can view their own tenant record" ON public.tenants;
DROP POLICY IF EXISTS "Landlords can manage tenant unit access" ON public.tenant_unit_access;

-- Recreate tenants policy using security definer function (no recursion)
CREATE POLICY "Tenants can view their own tenant record"
ON public.tenants
FOR SELECT
USING (id IN (SELECT get_tenant_ids_for_user(auth.uid())));

-- Recreate tenant_unit_access policy using security definer function (no recursion)
CREATE POLICY "Landlords can manage tenant unit access"
ON public.tenant_unit_access
FOR ALL
USING (tenant_in_user_org(tenant_id, auth.uid()));
