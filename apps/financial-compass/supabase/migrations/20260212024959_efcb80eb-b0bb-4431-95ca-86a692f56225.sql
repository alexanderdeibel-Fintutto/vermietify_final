
-- Table to track sent invitations
CREATE TABLE public.app_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sent_by uuid NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  app_id text NOT NULL,
  app_name text NOT NULL,
  property_name text,
  property_address text,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invitations" ON public.app_invitations
  FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Members can create invitations" ON public.app_invitations
  FOR INSERT WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members can update invitations" ON public.app_invitations
  FOR UPDATE USING (is_company_member(company_id));

CREATE POLICY "Members can delete invitations" ON public.app_invitations
  FOR DELETE USING (is_company_member(company_id));

CREATE INDEX idx_app_invitations_company ON public.app_invitations(company_id);
CREATE INDEX idx_app_invitations_status ON public.app_invitations(status);
