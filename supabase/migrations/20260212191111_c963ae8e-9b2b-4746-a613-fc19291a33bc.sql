
-- FIX 2: Audit logs - restrict to admin only
DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs in their organization"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- FIX 3: Tenant sensitive PII - secure view with masked fields
CREATE OR REPLACE FUNCTION public.can_view_sensitive_tenant_data(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE VIEW public.tenants_safe AS
SELECT
  id, organization_id, first_name, last_name, email, phone,
  address, postal_code, city, notes, status, created_at, updated_at,
  CASE WHEN can_view_sensitive_tenant_data(auth.uid()) THEN birth_date ELSE NULL END AS birth_date,
  CASE WHEN can_view_sensitive_tenant_data(auth.uid()) THEN income_cents ELSE NULL END AS income_cents,
  CASE WHEN can_view_sensitive_tenant_data(auth.uid()) THEN household_size ELSE NULL END AS household_size,
  CASE WHEN can_view_sensitive_tenant_data(auth.uid()) THEN previous_landlord ELSE NULL END AS previous_landlord,
  CASE WHEN can_view_sensitive_tenant_data(auth.uid()) THEN schufa_status ELSE NULL END AS schufa_status,
  CASE WHEN can_view_sensitive_tenant_data(auth.uid()) THEN is_social_benefits ELSE NULL END AS is_social_benefits
FROM public.tenants;
