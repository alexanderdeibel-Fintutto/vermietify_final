-- Create esignature status enum
CREATE TYPE public.esignature_status AS ENUM ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired', 'cancelled');

-- Create esignature orders table
CREATE TABLE public.esignature_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  document_id UUID REFERENCES public.documents(id),
  document_path TEXT,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  provider TEXT NOT NULL DEFAULT 'internal',
  provider_order_id TEXT,
  status public.esignature_status NOT NULL DEFAULT 'draft',
  signers JSONB NOT NULL DEFAULT '[]'::jsonb,
  signature_fields JSONB DEFAULT '[]'::jsonb,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  signed_document_path TEXT,
  reminder_days INTEGER[] DEFAULT ARRAY[3, 7, 10],
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create esignature events table for audit trail
CREATE TABLE public.esignature_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.esignature_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  signer_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.esignature_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esignature_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for esignature_orders
CREATE POLICY "Users can view orders in their organization"
ON public.esignature_orders FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create orders in their organization"
ON public.esignature_orders FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update orders in their organization"
ON public.esignature_orders FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete orders in their organization"
ON public.esignature_orders FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- RLS Policies for esignature_events
CREATE POLICY "Users can view events for their orders"
ON public.esignature_events FOR SELECT
USING (order_id IN (
  SELECT id FROM public.esignature_orders
  WHERE organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can insert events for their orders"
ON public.esignature_events FOR INSERT
WITH CHECK (order_id IN (
  SELECT id FROM public.esignature_orders
  WHERE organization_id = public.get_user_organization_id(auth.uid())
));

-- Add triggers for updated_at
CREATE TRIGGER update_esignature_orders_updated_at
  BEFORE UPDATE ON public.esignature_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();