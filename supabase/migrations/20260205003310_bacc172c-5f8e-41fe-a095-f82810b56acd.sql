-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create operating_cost_statements table
CREATE TABLE public.operating_cost_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_costs INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'sent')),
  payment_deadline DATE,
  vacancy_costs_to_landlord BOOLEAN NOT NULL DEFAULT true,
  options_generate_pdf BOOLEAN NOT NULL DEFAULT false,
  options_individual_statements BOOLEAN NOT NULL DEFAULT false,
  options_send_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operating_cost_items table
CREATE TABLE public.operating_cost_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID NOT NULL REFERENCES public.operating_cost_statements(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL,
  cost_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  distribution_key TEXT NOT NULL CHECK (distribution_key IN ('area', 'persons', 'units', 'consumption')),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operating_cost_tenant_results table
CREATE TABLE public.operating_cost_tenant_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID NOT NULL REFERENCES public.operating_cost_statements(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  unit_number TEXT NOT NULL,
  tenant_name TEXT,
  area NUMERIC NOT NULL DEFAULT 0,
  persons INTEGER NOT NULL DEFAULT 0,
  heating_share NUMERIC NOT NULL DEFAULT 0,
  prepayments INTEGER NOT NULL DEFAULT 0,
  cost_share INTEGER NOT NULL DEFAULT 0,
  result INTEGER NOT NULL DEFAULT 0,
  cost_breakdown JSONB,
  is_vacant BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operating_cost_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_cost_tenant_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for statements
CREATE POLICY "Users can view statements in their organization"
  ON public.operating_cost_statements FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert statements in their organization"
  ON public.operating_cost_statements FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update statements in their organization"
  ON public.operating_cost_statements FOR UPDATE
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete statements in their organization"
  ON public.operating_cost_statements FOR DELETE
  USING (organization_id = get_user_organization_id(auth.uid()));

-- RLS policies for items
CREATE POLICY "Users can view cost items in their statements"
  ON public.operating_cost_items FOR SELECT
  USING (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can insert cost items in their statements"
  ON public.operating_cost_items FOR INSERT
  WITH CHECK (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can update cost items in their statements"
  ON public.operating_cost_items FOR UPDATE
  USING (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can delete cost items in their statements"
  ON public.operating_cost_items FOR DELETE
  USING (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

-- RLS policies for tenant results
CREATE POLICY "Users can view tenant results in their statements"
  ON public.operating_cost_tenant_results FOR SELECT
  USING (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can insert tenant results in their statements"
  ON public.operating_cost_tenant_results FOR INSERT
  WITH CHECK (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can update tenant results in their statements"
  ON public.operating_cost_tenant_results FOR UPDATE
  USING (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can delete tenant results in their statements"
  ON public.operating_cost_tenant_results FOR DELETE
  USING (statement_id IN (SELECT id FROM public.operating_cost_statements WHERE organization_id = get_user_organization_id(auth.uid())));

-- Add updated_at trigger
CREATE TRIGGER update_operating_cost_statements_updated_at
  BEFORE UPDATE ON public.operating_cost_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_operating_cost_statements_organization ON public.operating_cost_statements(organization_id);
CREATE INDEX idx_operating_cost_statements_building ON public.operating_cost_statements(building_id);
CREATE INDEX idx_operating_cost_items_statement ON public.operating_cost_items(statement_id);
CREATE INDEX idx_operating_cost_tenant_results_statement ON public.operating_cost_tenant_results(statement_id);