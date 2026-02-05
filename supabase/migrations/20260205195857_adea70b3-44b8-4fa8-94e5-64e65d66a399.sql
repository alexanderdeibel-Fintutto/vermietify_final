-- Email Templates Table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('contract', 'payment', 'operating_costs', 'maintenance', 'general')),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  default_attachments JSONB DEFAULT '[]',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Log Table
CREATE TABLE public.email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Users can view templates in their org or system templates"
  ON public.email_templates FOR SELECT
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR is_system = true);

CREATE POLICY "Users can insert templates in their org"
  ON public.email_templates FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()) AND is_system = false);

CREATE POLICY "Users can update templates in their org"
  ON public.email_templates FOR UPDATE
  USING (organization_id = public.get_user_organization_id(auth.uid()) AND is_system = false);

CREATE POLICY "Users can delete templates in their org"
  ON public.email_templates FOR DELETE
  USING (organization_id = public.get_user_organization_id(auth.uid()) AND is_system = false);

-- RLS Policies for email_log
CREATE POLICY "Users can view email logs in their org"
  ON public.email_log FOR SELECT
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert email logs in their org"
  ON public.email_log FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update email logs in their org"
  ON public.email_log FOR UPDATE
  USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Triggers
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_email_templates_org ON public.email_templates(organization_id);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);
CREATE INDEX idx_email_log_org ON public.email_log(organization_id);
CREATE INDEX idx_email_log_status ON public.email_log(status);
CREATE INDEX idx_email_log_tenant ON public.email_log(recipient_tenant_id);

-- Insert system templates
INSERT INTO public.email_templates (organization_id, name, category, subject, body_html, is_system) VALUES
(NULL, 'Willkommen neuer Mieter', 'contract', 'Willkommen in Ihrer neuen Wohnung – {{einheit.name}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>herzlich willkommen in Ihrer neuen Wohnung <strong>{{einheit.name}}</strong> im {{gebaeude.name}}!</p><p>Ihr Mietvertrag beginnt am {{vertrag.beginn}}. Die monatliche Miete beträgt {{vertrag.miete}}.</p><p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Zahlungserinnerung (1. Mahnung)', 'payment', 'Freundliche Zahlungserinnerung – {{einheit.name}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>wir möchten Sie freundlich daran erinnern, dass die Zahlung in Höhe von <strong>{{zahlung.betrag}}</strong> zum {{zahlung.faellig}} fällig war.</p><p>Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Zahlungserinnerung (2. Mahnung)', 'payment', 'Zweite Zahlungserinnerung – Dringend', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>trotz unserer ersten Erinnerung ist der Betrag von <strong>{{zahlung.betrag}}</strong> weiterhin offen.</p><p>Wir bitten Sie dringend, die Zahlung umgehend zu veranlassen.</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Betriebskostenabrechnung Ankündigung', 'operating_costs', 'Ankündigung Betriebskostenabrechnung {{abrechnung.zeitraum}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>hiermit kündigen wir die Betriebskostenabrechnung für den Zeitraum {{abrechnung.zeitraum}} an.</p><p>Die Abrechnung wird Ihnen in Kürze zugestellt.</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Betriebskostenabrechnung Versand', 'operating_costs', 'Betriebskostenabrechnung {{abrechnung.zeitraum}} – {{einheit.name}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>anbei erhalten Sie die Betriebskostenabrechnung für den Zeitraum {{abrechnung.zeitraum}}.</p><p><strong>Ergebnis: {{abrechnung.ergebnis}}</strong></p><p>Bei Fragen zur Abrechnung stehen wir Ihnen gerne zur Verfügung.</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Mieterhöhung Ankündigung', 'contract', 'Ankündigung Mietanpassung – {{einheit.name}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>hiermit kündigen wir eine Anpassung Ihrer Miete an.</p><p>Die neue Miete beträgt ab dem {{datum.heute}}: <strong>{{vertrag.miete}}</strong></p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Kündigungsbestätigung', 'contract', 'Bestätigung Ihrer Kündigung – {{einheit.name}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>hiermit bestätigen wir den Erhalt Ihrer Kündigung für die Wohnung {{einheit.name}}.</p><p>Zur Wohnungsübergabe werden wir uns rechtzeitig mit Ihnen in Verbindung setzen.</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Wartungsankündigung', 'maintenance', 'Ankündigung Wartungsarbeiten – {{gebaeude.name}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>wir möchten Sie über geplante Wartungsarbeiten im {{gebaeude.name}} informieren.</p><p>Wir bitten um Ihr Verständnis für eventuelle Einschränkungen.</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Zählerablesung Erinnerung', 'operating_costs', 'Bitte um Zählerablesung – {{einheit.name}}', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>wir bitten Sie, die Zählerstände in Ihrer Wohnung {{einheit.name}} abzulesen und uns mitzuteilen.</p><p>Vielen Dank für Ihre Mithilfe!</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true),
(NULL, 'Allgemeines Schreiben', 'general', '{{einheit.name}} – Information', '<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p><p>[Ihr Text hier]</p><p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>', true);