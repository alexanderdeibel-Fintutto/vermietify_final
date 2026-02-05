-- Create whatsapp_contacts table
CREATE TABLE public.whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  phone TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  display_name TEXT,
  opted_in BOOLEAN NOT NULL DEFAULT false,
  opted_in_at TIMESTAMP WITH TIME ZONE,
  opt_out_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, phone)
);

-- Create whatsapp_messages table
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  contact_id UUID REFERENCES public.whatsapp_contacts(id),
  contact_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'image', 'document', 'audio', 'video', 'location')),
  content TEXT,
  template_name TEXT,
  template_params JSONB DEFAULT '[]'::jsonb,
  media_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  whatsapp_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_templates table
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('utility', 'marketing', 'authentication')),
  language TEXT NOT NULL DEFAULT 'de',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  header_type TEXT CHECK (header_type IN ('none', 'text', 'image', 'document', 'video')),
  header_content TEXT,
  body TEXT NOT NULL,
  footer TEXT,
  buttons JSONB DEFAULT '[]'::jsonb,
  whatsapp_template_id TEXT,
  rejection_reason TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_broadcasts table
CREATE TABLE public.whatsapp_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.whatsapp_templates(id),
  recipient_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create whatsapp_settings table
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) UNIQUE,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token_encrypted TEXT,
  webhook_verify_token TEXT,
  business_name TEXT,
  business_description TEXT,
  business_address TEXT,
  greeting_message TEXT,
  away_message TEXT,
  away_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_contacts
CREATE POLICY "Users can view contacts in their organization"
ON public.whatsapp_contacts FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create contacts in their organization"
ON public.whatsapp_contacts FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update contacts in their organization"
ON public.whatsapp_contacts FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete contacts in their organization"
ON public.whatsapp_contacts FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can view messages in their organization"
ON public.whatsapp_messages FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create messages in their organization"
ON public.whatsapp_messages FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update messages in their organization"
ON public.whatsapp_messages FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for whatsapp_templates
CREATE POLICY "Users can view templates in their organization"
ON public.whatsapp_templates FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create templates in their organization"
ON public.whatsapp_templates FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update templates in their organization"
ON public.whatsapp_templates FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete templates in their organization"
ON public.whatsapp_templates FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for whatsapp_broadcasts
CREATE POLICY "Users can view broadcasts in their organization"
ON public.whatsapp_broadcasts FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create broadcasts in their organization"
ON public.whatsapp_broadcasts FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update broadcasts in their organization"
ON public.whatsapp_broadcasts FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete broadcasts in their organization"
ON public.whatsapp_broadcasts FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for whatsapp_settings
CREATE POLICY "Users can view settings in their organization"
ON public.whatsapp_settings FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create settings in their organization"
ON public.whatsapp_settings FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update settings in their organization"
ON public.whatsapp_settings FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_whatsapp_settings_updated_at
  BEFORE UPDATE ON public.whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;