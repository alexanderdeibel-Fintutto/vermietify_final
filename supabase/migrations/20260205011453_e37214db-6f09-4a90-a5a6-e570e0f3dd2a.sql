-- Add 'tenant' to app_role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tenant' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'tenant';
  END IF;
END$$;

-- Create tenant_unit_access table to link tenants to their units
CREATE TABLE IF NOT EXISTS public.tenant_unit_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.leases(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_user_id, unit_id)
);

-- Enable RLS
ALTER TABLE public.tenant_unit_access ENABLE ROW LEVEL SECURITY;

-- Tenants can see their own access
CREATE POLICY "Tenants can view their own unit access"
ON public.tenant_unit_access FOR SELECT
USING (tenant_user_id = auth.uid());

-- Landlords can manage tenant access in their org
CREATE POLICY "Landlords can manage tenant unit access"
ON public.tenant_unit_access FOR ALL
USING (
  tenant_id IN (
    SELECT id FROM public.tenants 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

-- Create document_requests table for tenant document requests
CREATE TABLE IF NOT EXISTS public.document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view and create their own requests"
ON public.document_requests FOR SELECT
USING (tenant_user_id = auth.uid());

CREATE POLICY "Tenants can insert their own requests"
ON public.document_requests FOR INSERT
WITH CHECK (tenant_user_id = auth.uid());

CREATE POLICY "Landlords can manage document requests"
ON public.document_requests FOR ALL
USING (
  tenant_id IN (
    SELECT id FROM public.tenants 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

-- Add policies for tenants to view their own data
CREATE POLICY "Tenants can view their own tenant record"
ON public.tenants FOR SELECT
USING (
  id IN (
    SELECT tenant_id FROM public.tenant_unit_access 
    WHERE tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their leases"
ON public.leases FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_unit_access 
    WHERE tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their units"
ON public.units FOR SELECT
USING (
  id IN (
    SELECT unit_id FROM public.tenant_unit_access 
    WHERE tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view buildings of their units"
ON public.buildings FOR SELECT
USING (
  id IN (
    SELECT u.building_id FROM public.units u
    JOIN public.tenant_unit_access tua ON tua.unit_id = u.id
    WHERE tua.tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view meters in their units"
ON public.meters FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id FROM public.tenant_unit_access 
    WHERE tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can insert meter readings for their units"
ON public.meter_readings FOR INSERT
WITH CHECK (
  meter_id IN (
    SELECT m.id FROM public.meters m
    JOIN public.tenant_unit_access tua ON tua.unit_id = m.unit_id
    WHERE tua.tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view meter readings for their units"
ON public.meter_readings FOR SELECT
USING (
  meter_id IN (
    SELECT m.id FROM public.meters m
    JOIN public.tenant_unit_access tua ON tua.unit_id = m.unit_id
    WHERE tua.tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view documents shared with them"
ON public.documents FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_unit_access 
    WHERE tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can create tasks for their units"
ON public.tasks FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT unit_id FROM public.tenant_unit_access 
    WHERE tenant_user_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view tasks they created"
ON public.tasks FOR SELECT
USING (
  created_by = auth.uid()
);