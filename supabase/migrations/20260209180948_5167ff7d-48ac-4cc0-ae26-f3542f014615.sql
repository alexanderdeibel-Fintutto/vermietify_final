
-- Add building_id and max_area_sqm to kdu_rates
ALTER TABLE public.kdu_rates 
  ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS max_area_sqm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS region_name TEXT;

-- Make municipality nullable (we'll use region_name going forward)
ALTER TABLE public.kdu_rates ALTER COLUMN municipality DROP NOT NULL;

-- Create index for building lookup
CREATE INDEX IF NOT EXISTS idx_kdu_rates_building_id ON public.kdu_rates(building_id);

-- Add RLS policy for building-based access
DROP POLICY IF EXISTS "Users can view kdu_rates of their org" ON public.kdu_rates;
CREATE POLICY "Users can view kdu_rates of their org" 
  ON public.kdu_rates FOR SELECT 
  USING (organization_id = get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "Users can insert kdu_rates for their org" ON public.kdu_rates;
CREATE POLICY "Users can insert kdu_rates for their org" 
  ON public.kdu_rates FOR INSERT 
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update kdu_rates of their org" ON public.kdu_rates;
CREATE POLICY "Users can update kdu_rates of their org" 
  ON public.kdu_rates FOR UPDATE 
  USING (organization_id = get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "Users can delete kdu_rates of their org" ON public.kdu_rates;
CREATE POLICY "Users can delete kdu_rates of their org" 
  ON public.kdu_rates FOR DELETE 
  USING (organization_id = get_user_organization_id(auth.uid()));
