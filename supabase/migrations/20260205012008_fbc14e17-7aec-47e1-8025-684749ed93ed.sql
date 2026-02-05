-- Create ai_conversations table for storing chat history
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text,
  context text, -- stores page context like 'tax', 'documents', etc.
  messages jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
ON public.ai_conversations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
ON public.ai_conversations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
ON public.ai_conversations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
ON public.ai_conversations FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create tax_documents table for uploaded tax receipts
CREATE TABLE IF NOT EXISTS public.tax_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL,
  year integer NOT NULL,
  category text NOT NULL, -- 'repair', 'insurance', 'interest', 'administration', 'other'
  title text NOT NULL,
  amount integer, -- in cents
  document_date date,
  file_url text NOT NULL,
  file_size integer,
  ocr_data jsonb, -- stores OCR extracted data
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tax documents in their org"
ON public.tax_documents FOR ALL
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE TRIGGER update_tax_documents_updated_at
BEFORE UPDATE ON public.tax_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();