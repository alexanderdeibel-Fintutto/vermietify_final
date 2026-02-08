
-- Inbound email address per organization
CREATE TABLE public.inbound_email_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_prefix TEXT NOT NULL,
  full_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allowed_senders TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inbound_email_addresses_org_unique UNIQUE (organization_id),
  CONSTRAINT inbound_email_addresses_prefix_unique UNIQUE (email_prefix),
  CONSTRAINT inbound_email_addresses_full_unique UNIQUE (full_address)
);

-- Enable RLS
ALTER TABLE public.inbound_email_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org inbound address"
  ON public.inbound_email_addresses FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their org inbound address"
  ON public.inbound_email_addresses FOR UPDATE
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert their org inbound address"
  ON public.inbound_email_addresses FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Inbound email queue
CREATE TABLE public.inbound_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  processing_result JSONB,
  matched_building_id UUID REFERENCES public.buildings(id),
  matched_cost_type_id UUID REFERENCES public.cost_types(id),
  amount_cents INTEGER,
  invoice_date DATE,
  invoice_number TEXT,
  vendor_name TEXT,
  attachments JSONB NOT NULL DEFAULT '[]',
  review_notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org inbound emails"
  ON public.inbound_emails FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their org inbound emails"
  ON public.inbound_emails FOR UPDATE
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Service role can insert inbound emails"
  ON public.inbound_emails FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_inbound_email_addresses_updated_at
  BEFORE UPDATE ON public.inbound_email_addresses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_inbound_emails_updated_at
  BEFORE UPDATE ON public.inbound_emails
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for fast queue lookups
CREATE INDEX idx_inbound_emails_org_status ON public.inbound_emails(organization_id, status);
CREATE INDEX idx_inbound_emails_received_at ON public.inbound_emails(received_at DESC);

-- Storage bucket for inbound email attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('inbound-attachments', 'inbound-attachments', false);

CREATE POLICY "Org members can view inbound attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inbound-attachments');

CREATE POLICY "Service role can upload inbound attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inbound-attachments');
