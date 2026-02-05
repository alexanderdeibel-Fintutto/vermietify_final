-- Create enum for adjustment types
CREATE TYPE public.rent_adjustment_type AS ENUM ('index', 'staffel', 'vergleichsmiete');

-- Create enum for adjustment status
CREATE TYPE public.rent_adjustment_status AS ENUM ('pending', 'announced', 'active', 'cancelled');

-- Table for Verbraucherpreisindex (Consumer Price Index)
CREATE TABLE public.vpi_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  value DECIMAL(10,2) NOT NULL,
  change_yoy_percent DECIMAL(5,2),
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

-- Table for rent adjustments
CREATE TABLE public.rent_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.rent_adjustment_type NOT NULL,
  old_rent_cents INTEGER NOT NULL,
  new_rent_cents INTEGER NOT NULL,
  effective_date DATE NOT NULL,
  index_old DECIMAL(10,2),
  index_new DECIMAL(10,2),
  index_change_percent DECIMAL(5,2),
  step_number INTEGER,
  announcement_sent_at TIMESTAMP WITH TIME ZONE,
  announcement_document_id UUID REFERENCES public.documents(id),
  status public.rent_adjustment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for contract rent settings (index/staffel configuration)
CREATE TABLE public.lease_rent_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE UNIQUE,
  rent_type public.rent_adjustment_type NOT NULL DEFAULT 'vergleichsmiete',
  -- Index rent settings
  index_base_value DECIMAL(10,2),
  index_base_date DATE,
  index_min_change_percent DECIMAL(5,2) DEFAULT 0,
  index_announcement_months INTEGER DEFAULT 3,
  -- Staffel rent settings
  staffel_steps JSONB DEFAULT '[]',
  -- General settings
  last_adjustment_date DATE,
  next_adjustment_due DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vpi_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_rent_settings ENABLE ROW LEVEL SECURITY;

-- VPI Index is public read (government data)
CREATE POLICY "VPI index is publicly readable"
  ON public.vpi_index FOR SELECT
  USING (true);

-- Only system can insert VPI data
CREATE POLICY "Only system can insert VPI"
  ON public.vpi_index FOR INSERT
  WITH CHECK (false);

-- Rent adjustments policies
CREATE POLICY "Users can view their organization rent adjustments"
  ON public.rent_adjustments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create rent adjustments for their organization"
  ON public.rent_adjustments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization rent adjustments"
  ON public.rent_adjustments FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization rent adjustments"
  ON public.rent_adjustments FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Lease rent settings policies
CREATE POLICY "Users can view their lease rent settings"
  ON public.lease_rent_settings FOR SELECT
  USING (
    lease_id IN (
      SELECT l.id FROM public.leases l
      JOIN public.units u ON l.unit_id = u.id
      JOIN public.buildings b ON u.building_id = b.id
      JOIN public.profiles p ON b.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their lease rent settings"
  ON public.lease_rent_settings FOR ALL
  USING (
    lease_id IN (
      SELECT l.id FROM public.leases l
      JOIN public.units u ON l.unit_id = u.id
      JOIN public.buildings b ON u.building_id = b.id
      JOIN public.profiles p ON b.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_rent_adjustments_lease ON public.rent_adjustments(lease_id);
CREATE INDEX idx_rent_adjustments_org ON public.rent_adjustments(organization_id);
CREATE INDEX idx_rent_adjustments_status ON public.rent_adjustments(status);
CREATE INDEX idx_rent_adjustments_effective ON public.rent_adjustments(effective_date);
CREATE INDEX idx_vpi_index_year_month ON public.vpi_index(year, month);
CREATE INDEX idx_lease_rent_settings_next ON public.lease_rent_settings(next_adjustment_due);

-- Insert historical VPI data (Basis 2020=100)
INSERT INTO public.vpi_index (year, month, value, change_yoy_percent) VALUES
(2020, 1, 100.0, NULL),
(2020, 6, 100.8, NULL),
(2020, 12, 99.8, NULL),
(2021, 1, 100.5, 0.5),
(2021, 6, 102.6, 1.8),
(2021, 12, 105.3, 5.5),
(2022, 1, 105.2, 4.7),
(2022, 6, 108.2, 5.5),
(2022, 12, 113.2, 7.5),
(2023, 1, 114.3, 8.7),
(2023, 6, 116.8, 7.9),
(2023, 12, 117.4, 3.7),
(2024, 1, 117.6, 2.9),
(2024, 6, 119.4, 2.2),
(2024, 12, 120.8, 2.9),
(2025, 1, 121.2, 3.1),
(2025, 6, 122.5, 2.6),
(2025, 12, 123.8, 2.5),
(2026, 1, 124.5, 2.7);

-- Trigger for updated_at
CREATE TRIGGER update_rent_adjustments_updated_at
  BEFORE UPDATE ON public.rent_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lease_rent_settings_updated_at
  BEFORE UPDATE ON public.lease_rent_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();