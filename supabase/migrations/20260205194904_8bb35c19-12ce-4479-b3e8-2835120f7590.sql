-- CO2 Cost Allocation System (CO2KostAufG)

-- Table for energy certificates
CREATE TABLE public.energy_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('bedarfsausweis', 'verbrauchsausweis')),
  valid_until DATE,
  energy_demand_kwh_sqm DECIMAL(10,2),
  primary_energy_demand DECIMAL(10,2),
  energy_source TEXT NOT NULL DEFAULT 'gas' CHECK (energy_source IN ('gas', 'oil', 'fernwaerme', 'waermepumpe', 'pellets', 'other')),
  co2_emission_factor DECIMAL(6,4), -- kg CO2 per kWh
  pdf_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for CO2 calculations per billing period
CREATE TABLE public.co2_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  energy_certificate_id UUID REFERENCES public.energy_certificates(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  heated_area_sqm DECIMAL(10,2) NOT NULL,
  energy_consumption_kwh DECIMAL(12,2) NOT NULL,
  energy_source TEXT NOT NULL DEFAULT 'gas',
  co2_emission_factor DECIMAL(6,4) NOT NULL, -- kg CO2 per kWh
  co2_emissions_kg DECIMAL(12,2) NOT NULL,
  co2_per_sqm_year DECIMAL(8,2) NOT NULL,
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 10),
  landlord_share_percent INTEGER NOT NULL CHECK (landlord_share_percent BETWEEN 0 AND 100),
  tenant_share_percent INTEGER NOT NULL CHECK (tenant_share_percent BETWEEN 0 AND 100),
  total_co2_cost_cents INTEGER NOT NULL DEFAULT 0,
  landlord_cost_cents INTEGER NOT NULL DEFAULT 0,
  tenant_cost_cents INTEGER NOT NULL DEFAULT 0,
  calculation_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'applied')),
  applied_to_billing_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.energy_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co2_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for energy_certificates
CREATE POLICY "Users can view energy certificates in their org"
  ON public.energy_certificates FOR SELECT
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert energy certificates in their org"
  ON public.energy_certificates FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update energy certificates in their org"
  ON public.energy_certificates FOR UPDATE
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete energy certificates in their org"
  ON public.energy_certificates FOR DELETE
  USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for co2_calculations
CREATE POLICY "Users can view CO2 calculations in their org"
  ON public.co2_calculations FOR SELECT
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert CO2 calculations in their org"
  ON public.co2_calculations FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update CO2 calculations in their org"
  ON public.co2_calculations FOR UPDATE
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete CO2 calculations in their org"
  ON public.co2_calculations FOR DELETE
  USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_energy_certificates_updated_at
  BEFORE UPDATE ON public.energy_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_co2_calculations_updated_at
  BEFORE UPDATE ON public.co2_calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_energy_certificates_building ON public.energy_certificates(building_id);
CREATE INDEX idx_energy_certificates_org ON public.energy_certificates(organization_id);
CREATE INDEX idx_co2_calculations_building ON public.co2_calculations(building_id);
CREATE INDEX idx_co2_calculations_org ON public.co2_calculations(organization_id);
CREATE INDEX idx_co2_calculations_period ON public.co2_calculations(period_start, period_end);