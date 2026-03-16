
-- Assets/Vermögensgegenstände table
CREATE TABLE public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'sonstige',
  description text,
  purchase_date date,
  purchase_price numeric,
  current_value numeric,
  -- Real estate specific fields
  address text,
  city text,
  zip text,
  units integer,
  area_sqm numeric,
  -- General fields
  serial_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for company lookup
CREATE INDEX idx_assets_company_id ON public.assets(company_id);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view assets" ON public.assets FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create assets" ON public.assets FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update assets" ON public.assets FOR UPDATE USING (is_company_member(company_id));
CREATE POLICY "Members can delete assets" ON public.assets FOR DELETE USING (is_company_member(company_id));

-- Updated_at trigger
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
