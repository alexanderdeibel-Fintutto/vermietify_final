-- ==================================================
-- MULTI-TENANT: org_memberships table
-- ==================================================
CREATE TABLE public.org_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_memberships
CREATE POLICY "Users can view memberships in their organizations"
ON public.org_memberships FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage memberships"
ON public.org_memberships FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.org_memberships 
    WHERE organization_id = org_memberships.organization_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE INDEX idx_org_memberships_org ON public.org_memberships(organization_id);
CREATE INDEX idx_org_memberships_user ON public.org_memberships(user_id);

-- ==================================================
-- AUDIT LOG
-- ==================================================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'export', 'import')),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view audit logs in their organization"
ON public.audit_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==================================================
-- GDPR REQUESTS
-- ==================================================
CREATE TABLE public.gdpr_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'delete', 'anonymize')),
  tenant_id UUID REFERENCES public.tenants(id),
  requester_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes TEXT,
  result_file_path TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view GDPR requests in their organization"
ON public.gdpr_requests FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create GDPR requests"
ON public.gdpr_requests FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update GDPR requests"
ON public.gdpr_requests FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE INDEX idx_gdpr_requests_org ON public.gdpr_requests(organization_id);
CREATE INDEX idx_gdpr_requests_tenant ON public.gdpr_requests(tenant_id);

-- ==================================================
-- CONSENT TRACKING
-- ==================================================
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  revoked_date TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, tenant_id, consent_type)
);

-- Enable RLS
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consents in their organization"
ON public.consent_records FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage consents in their organization"
ON public.consent_records FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE INDEX idx_consent_records_org ON public.consent_records(organization_id);
CREATE INDEX idx_consent_records_tenant ON public.consent_records(tenant_id);

-- ==================================================
-- HELP CENTER: FAQ
-- ==================================================
CREATE TABLE public.faq_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[],
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed, FAQ is public
CREATE INDEX idx_faq_articles_category ON public.faq_articles(category);
CREATE INDEX idx_faq_articles_tags ON public.faq_articles USING GIN(tags);

-- Insert default FAQ articles
INSERT INTO public.faq_articles (category, question, answer, tags, order_index) VALUES
('getting_started', 'Wie erstelle ich mein erstes Gebäude?', 'Navigieren Sie zu "Immobilien" in der Seitenleiste und klicken Sie auf "Neues Gebäude". Füllen Sie die Pflichtfelder aus und speichern Sie.', ARRAY['gebäude', 'start', 'immobilien'], 1),
('getting_started', 'Wie lege ich einen Mieter an?', 'Gehen Sie zu "Mieter" und klicken Sie auf "Neuer Mieter". Geben Sie die Kontaktdaten ein und weisen Sie optional eine Einheit zu.', ARRAY['mieter', 'anlegen'], 2),
('payments', 'Wie erfasse ich eine Mietzahlung?', 'Unter "Finanzen" > "Zahlungen" können Sie eingehende Zahlungen erfassen und automatisch dem richtigen Mieter zuordnen.', ARRAY['zahlung', 'miete', 'finanzen'], 1),
('payments', 'Was bedeutet "überfällige Zahlung"?', 'Eine Zahlung gilt als überfällig, wenn das Fälligkeitsdatum überschritten wurde und kein Zahlungseingang verbucht wurde.', ARRAY['überfällig', 'mahnung'], 2),
('contracts', 'Wie erstelle ich einen Mietvertrag?', 'Navigieren Sie zu "Verträge" und nutzen Sie den Vertrags-Wizard für eine geführte Erstellung.', ARRAY['vertrag', 'mietvertrag'], 1),
('billing', 'Wann sollte ich die Nebenkostenabrechnung erstellen?', 'Die Nebenkostenabrechnung muss innerhalb von 12 Monaten nach Ende der Abrechnungsperiode zugestellt werden.', ARRAY['nebenkosten', 'abrechnung', 'frist'], 1),
('account', 'Wie ändere ich mein Passwort?', 'Gehen Sie zu "Einstellungen" > "Sicherheit" und klicken Sie auf "Passwort ändern".', ARRAY['passwort', 'sicherheit', 'konto'], 1),
('account', 'Wie kann ich weitere Benutzer einladen?', 'Als Administrator können Sie unter "Einstellungen" > "Team" neue Mitglieder einladen.', ARRAY['team', 'benutzer', 'einladung'], 2);

-- ==================================================
-- ONBOARDING CHECKLIST
-- ==================================================
CREATE TABLE public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  first_building_created BOOLEAN NOT NULL DEFAULT false,
  first_unit_created BOOLEAN NOT NULL DEFAULT false,
  first_tenant_created BOOLEAN NOT NULL DEFAULT false,
  first_contract_created BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.onboarding_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
ON public.onboarding_progress FOR ALL
USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_org_memberships_updated_at
BEFORE UPDATE ON public.org_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gdpr_requests_updated_at
BEFORE UPDATE ON public.gdpr_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
BEFORE UPDATE ON public.consent_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_articles_updated_at
BEFORE UPDATE ON public.faq_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();