
-- Email inbox configuration per company
CREATE TABLE public.email_inboxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inbox_address TEXT NOT NULL UNIQUE,
  allowed_senders TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incoming email receipts with processing status
CREATE TABLE public.email_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inbox_id UUID NOT NULL REFERENCES public.email_inboxes(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  file_name TEXT,
  file_url TEXT,
  vendor TEXT,
  amount NUMERIC,
  tax_amount NUMERIC,
  date TEXT,
  category TEXT,
  description TEXT,
  confidence NUMERIC,
  question_text TEXT,
  receipt_id UUID REFERENCES public.receipts(id),
  transaction_id UUID REFERENCES public.transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_inboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_inboxes
CREATE POLICY "Users can view their company email inboxes"
  ON public.email_inboxes FOR SELECT
  USING (public.is_company_member(company_id));

CREATE POLICY "Users can create email inboxes for their company"
  ON public.email_inboxes FOR INSERT
  WITH CHECK (public.is_company_member(company_id));

CREATE POLICY "Users can update their company email inboxes"
  ON public.email_inboxes FOR UPDATE
  USING (public.is_company_member(company_id));

CREATE POLICY "Users can delete their company email inboxes"
  ON public.email_inboxes FOR DELETE
  USING (public.is_company_member(company_id));

-- RLS policies for email_receipts
CREATE POLICY "Users can view their company email receipts"
  ON public.email_receipts FOR SELECT
  USING (public.is_company_member(company_id));

CREATE POLICY "Users can create email receipts for their company"
  ON public.email_receipts FOR INSERT
  WITH CHECK (public.is_company_member(company_id));

CREATE POLICY "Users can update their company email receipts"
  ON public.email_receipts FOR UPDATE
  USING (public.is_company_member(company_id));

CREATE POLICY "Users can delete their company email receipts"
  ON public.email_receipts FOR DELETE
  USING (public.is_company_member(company_id));

-- Triggers for updated_at
CREATE TRIGGER update_email_inboxes_updated_at
  BEFORE UPDATE ON public.email_inboxes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_receipts_updated_at
  BEFORE UPDATE ON public.email_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('email-attachments', 'email-attachments', false);

CREATE POLICY "Users can view email attachments from their company"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'email-attachments');

CREATE POLICY "Service role can upload email attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'email-attachments');
