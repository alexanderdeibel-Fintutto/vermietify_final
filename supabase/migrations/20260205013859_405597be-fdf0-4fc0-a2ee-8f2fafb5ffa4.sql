-- Create letter status enum
CREATE TYPE public.letter_status AS ENUM ('draft', 'submitted', 'printing', 'sent', 'delivered', 'error', 'cancelled');

-- Create letter templates table
CREATE TABLE public.letter_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT,
  content TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create letter settings table
CREATE TABLE public.letter_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) UNIQUE,
  api_key_encrypted TEXT,
  test_mode BOOLEAN DEFAULT true,
  default_sender JSONB,
  letterhead_pdf_path TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create letter orders table
CREATE TABLE public.letter_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  recipient_type TEXT NOT NULL DEFAULT 'manual',
  recipient_id UUID,
  recipient_address JSONB NOT NULL,
  template_id UUID REFERENCES public.letter_templates(id),
  subject TEXT NOT NULL,
  content_pdf_path TEXT,
  options JSONB DEFAULT '{"color": false, "duplex": false, "registered": "none"}'::jsonb,
  letterxpress_id TEXT,
  status public.letter_status DEFAULT 'draft',
  tracking_code TEXT,
  cost_cents INTEGER DEFAULT 0,
  pages INTEGER DEFAULT 1,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create letter automation rules table
CREATE TABLE public.letter_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  template_id UUID REFERENCES public.letter_templates(id),
  is_active BOOLEAN DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for letter_templates
CREATE POLICY "Users can view system templates and own org templates"
ON public.letter_templates FOR SELECT
USING (is_system = true OR organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can manage own org templates"
ON public.letter_templates FOR ALL
USING (organization_id = public.get_user_organization_id(auth.uid()) AND is_system = false);

-- RLS Policies for letter_settings
CREATE POLICY "Users can view own org settings"
ON public.letter_settings FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can manage own org settings"
ON public.letter_settings FOR ALL
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for letter_orders
CREATE POLICY "Users can view own org orders"
ON public.letter_orders FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can manage own org orders"
ON public.letter_orders FOR ALL
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for letter_automation_rules
CREATE POLICY "Users can view own org rules"
ON public.letter_automation_rules FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can manage own org rules"
ON public.letter_automation_rules FOR ALL
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Insert system templates
INSERT INTO public.letter_templates (name, category, subject, content, placeholders, is_system) VALUES
('Mieterhöhung', 'rent', 'Ankündigung Mieterhöhung', 'Sehr geehrte/r {{mieter_name}},

hiermit kündigen wir eine Erhöhung der Nettokaltmiete für die Wohnung {{adresse}} an.

Die monatliche Nettokaltmiete erhöht sich ab dem {{datum}} von {{alte_miete}} € auf {{neue_miete}} €.

Diese Erhöhung basiert auf {{begruendung}}.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "adresse", "datum", "alte_miete", "neue_miete", "begruendung", "vermieter_name"]', true),

('Nebenkostenabrechnung', 'billing', 'Betriebskostenabrechnung {{jahr}}', 'Sehr geehrte/r {{mieter_name}},

anbei erhalten Sie die Betriebskostenabrechnung für das Jahr {{jahr}} für die Wohnung {{adresse}}.

Gesamtkosten: {{gesamtkosten}} €
Ihre Vorauszahlungen: {{vorauszahlungen}} €
{{ergebnis_text}}: {{ergebnis_betrag}} €

{{zahlungshinweis}}

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "jahr", "adresse", "gesamtkosten", "vorauszahlungen", "ergebnis_text", "ergebnis_betrag", "zahlungshinweis", "vermieter_name"]', true),

('1. Mahnung', 'reminder', 'Zahlungserinnerung', 'Sehr geehrte/r {{mieter_name}},

leider mussten wir feststellen, dass die Mietzahlung für {{monat}} in Höhe von {{betrag}} € noch nicht eingegangen ist.

Bitte überweisen Sie den ausstehenden Betrag bis zum {{frist}} auf das Ihnen bekannte Konto.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "monat", "betrag", "frist", "vermieter_name"]', true),

('2. Mahnung', 'reminder', 'Zweite Mahnung - Zahlungsaufforderung', 'Sehr geehrte/r {{mieter_name}},

trotz unserer Zahlungserinnerung vom {{erste_mahnung_datum}} ist der offene Betrag von {{betrag}} € für {{monat}} noch nicht eingegangen.

Wir fordern Sie hiermit letztmalig auf, den Betrag bis zum {{frist}} zu begleichen.

Bei Nichtzahlung behalten wir uns weitere Schritte vor.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "erste_mahnung_datum", "betrag", "monat", "frist", "vermieter_name"]', true),

('3. Mahnung', 'reminder', 'Letzte Mahnung vor rechtlichen Schritten', 'Sehr geehrte/r {{mieter_name}},

der Betrag von {{betrag}} € für {{monat}} ist trotz mehrfacher Mahnungen nicht eingegangen.

Sollte der Betrag nicht bis zum {{frist}} eingehen, werden wir ohne weitere Ankündigung rechtliche Schritte einleiten.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "betrag", "monat", "frist", "vermieter_name"]', true),

('Kündigung', 'termination', 'Kündigung des Mietverhältnisses', 'Sehr geehrte/r {{mieter_name}},

hiermit kündigen wir das Mietverhältnis über die Wohnung {{adresse}} fristgerecht zum {{kuendigungsdatum}}.

Kündigungsgrund: {{kuendigungsgrund}}

Bitte übergeben Sie die Wohnung besenrein am {{uebergabedatum}}.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "adresse", "kuendigungsdatum", "kuendigungsgrund", "uebergabedatum", "vermieter_name"]', true),

('Allgemeines Schreiben', 'general', '{{betreff}}', '{{inhalt}}', '["betreff", "inhalt"]', true);

-- Add triggers for updated_at
CREATE TRIGGER update_letter_templates_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_letter_settings_updated_at
  BEFORE UPDATE ON public.letter_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_letter_orders_updated_at
  BEFORE UPDATE ON public.letter_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();