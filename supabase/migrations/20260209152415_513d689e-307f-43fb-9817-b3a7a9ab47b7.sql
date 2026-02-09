
-- 1. Add status and additional fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_social_benefits boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS household_size integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS income_cents integer,
ADD COLUMN IF NOT EXISTS previous_landlord text,
ADD COLUMN IF NOT EXISTS schufa_status text,
ADD COLUMN IF NOT EXISTS birth_date date;

-- 2. Create KdU rates table
CREATE TABLE public.kdu_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  municipality text NOT NULL,
  postal_code text,
  household_size integer NOT NULL DEFAULT 1,
  max_rent_cents integer NOT NULL,
  max_utilities_cents integer NOT NULL DEFAULT 0,
  max_heating_cents integer NOT NULL DEFAULT 0,
  max_total_cents integer NOT NULL,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, municipality, household_size, valid_from)
);

ALTER TABLE public.kdu_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org kdu_rates" ON public.kdu_rates
  FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert own org kdu_rates" ON public.kdu_rates
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update own org kdu_rates" ON public.kdu_rates
  FOR UPDATE USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete own org kdu_rates" ON public.kdu_rates
  FOR DELETE USING (organization_id = get_user_organization_id(auth.uid()));

CREATE TRIGGER update_kdu_rates_updated_at
  BEFORE UPDATE ON public.kdu_rates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Create rental_offers table
CREATE TABLE public.rental_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- Pricing
  rent_amount_cents integer NOT NULL,
  utility_advance_cents integer NOT NULL DEFAULT 0,
  heating_advance_cents integer NOT NULL DEFAULT 0,
  total_amount_cents integer NOT NULL,
  deposit_amount_cents integer NOT NULL DEFAULT 0,
  
  -- KdU reference
  kdu_rate_id UUID REFERENCES public.kdu_rates(id),
  is_kdu_eligible boolean DEFAULT false,
  kdu_max_total_cents integer,
  
  -- Dates
  proposed_start_date date NOT NULL,
  proposed_end_date date,
  valid_until date,
  
  -- Status
  status text NOT NULL DEFAULT 'draft',
  
  -- Additional
  special_agreements text,
  notes text,
  
  -- Converted to contract
  converted_lease_id UUID REFERENCES public.leases(id),
  converted_at timestamptz,
  
  created_by UUID,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org rental_offers" ON public.rental_offers
  FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert own org rental_offers" ON public.rental_offers
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update own org rental_offers" ON public.rental_offers
  FOR UPDATE USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete own org rental_offers" ON public.rental_offers
  FOR DELETE USING (organization_id = get_user_organization_id(auth.uid()));

CREATE TRIGGER update_rental_offers_updated_at
  BEFORE UPDATE ON public.rental_offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
