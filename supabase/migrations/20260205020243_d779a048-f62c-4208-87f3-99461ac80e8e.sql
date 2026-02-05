-- Create ELSTER submission status enum
CREATE TYPE elster_status AS ENUM ('draft', 'validating', 'submitted', 'accepted', 'rejected', 'notice_received');

-- Create ELSTER form type enum
CREATE TYPE elster_form_type AS ENUM ('anlage_v', 'anlage_kap', 'anlage_so', 'ust_va', 'ust_jahreserklaerung');

-- Table: elster_certificates
CREATE TABLE public.elster_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  certificate_name TEXT NOT NULL,
  certificate_fingerprint TEXT NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: elster_submissions
CREATE TABLE public.elster_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES public.elster_certificates(id) ON DELETE SET NULL,
  form_type elster_form_type NOT NULL,
  tax_year INTEGER NOT NULL,
  building_ids UUID[] DEFAULT '{}',
  data_json JSONB NOT NULL DEFAULT '{}',
  xml_content TEXT,
  status elster_status NOT NULL DEFAULT 'draft',
  transfer_ticket TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  response_xml TEXT,
  error_message TEXT,
  protocol_pdf_path TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: elster_notices (Steuerbescheide)
CREATE TABLE public.elster_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.elster_submissions(id) ON DELETE CASCADE,
  notice_date DATE NOT NULL,
  notice_pdf_path TEXT,
  assessed_tax_cents INTEGER NOT NULL DEFAULT 0,
  declared_tax_cents INTEGER NOT NULL DEFAULT 0,
  difference_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: elster_settings
CREATE TABLE public.elster_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  tax_number TEXT,
  tax_office_id TEXT,
  tax_office_name TEXT,
  notification_email TEXT,
  test_mode BOOLEAN NOT NULL DEFAULT true,
  auto_fetch_notices BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.elster_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elster_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elster_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elster_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for elster_certificates
CREATE POLICY "Users can view certificates in their organization"
ON public.elster_certificates FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create certificates in their organization"
ON public.elster_certificates FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update certificates in their organization"
ON public.elster_certificates FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete certificates in their organization"
ON public.elster_certificates FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()));

-- RLS Policies for elster_submissions
CREATE POLICY "Users can view submissions in their organization"
ON public.elster_submissions FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create submissions in their organization"
ON public.elster_submissions FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update submissions in their organization"
ON public.elster_submissions FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete submissions in their organization"
ON public.elster_submissions FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()));

-- RLS Policies for elster_notices
CREATE POLICY "Users can view notices for their submissions"
ON public.elster_notices FOR SELECT
USING (submission_id IN (
  SELECT id FROM public.elster_submissions 
  WHERE organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can create notices for their submissions"
ON public.elster_notices FOR INSERT
WITH CHECK (submission_id IN (
  SELECT id FROM public.elster_submissions 
  WHERE organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can update notices for their submissions"
ON public.elster_notices FOR UPDATE
USING (submission_id IN (
  SELECT id FROM public.elster_submissions 
  WHERE organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can delete notices for their submissions"
ON public.elster_notices FOR DELETE
USING (submission_id IN (
  SELECT id FROM public.elster_submissions 
  WHERE organization_id = get_user_organization_id(auth.uid())
));

-- RLS Policies for elster_settings
CREATE POLICY "Users can view settings in their organization"
ON public.elster_settings FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create settings in their organization"
ON public.elster_settings FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update settings in their organization"
ON public.elster_settings FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_elster_certificates_org ON public.elster_certificates(organization_id);
CREATE INDEX idx_elster_submissions_org ON public.elster_submissions(organization_id);
CREATE INDEX idx_elster_submissions_status ON public.elster_submissions(status);
CREATE INDEX idx_elster_submissions_year ON public.elster_submissions(tax_year);
CREATE INDEX idx_elster_notices_submission ON public.elster_notices(submission_id);
CREATE INDEX idx_elster_settings_org ON public.elster_settings(organization_id);

-- Trigger for updated_at
CREATE TRIGGER update_elster_certificates_updated_at
BEFORE UPDATE ON public.elster_certificates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elster_submissions_updated_at
BEFORE UPDATE ON public.elster_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elster_settings_updated_at
BEFORE UPDATE ON public.elster_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();