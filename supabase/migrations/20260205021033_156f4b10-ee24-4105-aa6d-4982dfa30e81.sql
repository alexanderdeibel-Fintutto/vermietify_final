-- Handover protocol status enum
CREATE TYPE public.handover_status AS ENUM ('planned', 'in_progress', 'completed', 'signed');

-- Handover type enum
CREATE TYPE public.handover_type AS ENUM ('move_in', 'move_out');

-- Defect severity enum
CREATE TYPE public.defect_severity AS ENUM ('light', 'medium', 'severe');

-- Key type enum
CREATE TYPE public.key_type AS ENUM ('front_door', 'apartment', 'basement', 'mailbox', 'garage', 'other');

-- Signer type enum
CREATE TYPE public.signer_type AS ENUM ('landlord', 'tenant', 'witness', 'caretaker');

-- Main handover protocols table
CREATE TABLE public.handover_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  type handover_type NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  status handover_status NOT NULL DEFAULT 'planned',
  pdf_path TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Handover rooms table
CREATE TABLE public.handover_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES public.handover_protocols(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  overall_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Handover defects table
CREATE TABLE public.handover_defects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES public.handover_protocols(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.handover_rooms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity defect_severity NOT NULL DEFAULT 'light',
  photo_paths TEXT[] DEFAULT '{}',
  is_tenant_responsible BOOLEAN NOT NULL DEFAULT false,
  estimated_cost_cents INTEGER DEFAULT 0,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Handover signatures table
CREATE TABLE public.handover_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES public.handover_protocols(id) ON DELETE CASCADE,
  signer_type signer_type NOT NULL,
  signer_name TEXT NOT NULL,
  signature_path TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Handover keys table
CREATE TABLE public.handover_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES public.handover_protocols(id) ON DELETE CASCADE,
  key_type key_type NOT NULL,
  key_label TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  handed_over BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.handover_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for handover_protocols
CREATE POLICY "Users can view protocols in their organization" 
  ON public.handover_protocols FOR SELECT 
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create protocols in their organization" 
  ON public.handover_protocols FOR INSERT 
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update protocols in their organization" 
  ON public.handover_protocols FOR UPDATE 
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete protocols in their organization" 
  ON public.handover_protocols FOR DELETE 
  USING (organization_id = get_user_organization_id(auth.uid()));

-- RLS Policies for handover_rooms
CREATE POLICY "Users can view rooms in their protocols" 
  ON public.handover_rooms FOR SELECT 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can create rooms in their protocols" 
  ON public.handover_rooms FOR INSERT 
  WITH CHECK (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can update rooms in their protocols" 
  ON public.handover_rooms FOR UPDATE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can delete rooms in their protocols" 
  ON public.handover_rooms FOR DELETE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

-- RLS Policies for handover_defects
CREATE POLICY "Users can view defects in their protocols" 
  ON public.handover_defects FOR SELECT 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can create defects in their protocols" 
  ON public.handover_defects FOR INSERT 
  WITH CHECK (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can update defects in their protocols" 
  ON public.handover_defects FOR UPDATE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can delete defects in their protocols" 
  ON public.handover_defects FOR DELETE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

-- RLS Policies for handover_signatures
CREATE POLICY "Users can view signatures in their protocols" 
  ON public.handover_signatures FOR SELECT 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can create signatures in their protocols" 
  ON public.handover_signatures FOR INSERT 
  WITH CHECK (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can update signatures in their protocols" 
  ON public.handover_signatures FOR UPDATE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can delete signatures in their protocols" 
  ON public.handover_signatures FOR DELETE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

-- RLS Policies for handover_keys
CREATE POLICY "Users can view keys in their protocols" 
  ON public.handover_keys FOR SELECT 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can create keys in their protocols" 
  ON public.handover_keys FOR INSERT 
  WITH CHECK (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can update keys in their protocols" 
  ON public.handover_keys FOR UPDATE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can delete keys in their protocols" 
  ON public.handover_keys FOR DELETE 
  USING (protocol_id IN (SELECT id FROM public.handover_protocols WHERE organization_id = get_user_organization_id(auth.uid())));

-- Create storage bucket for handover photos and signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('handover-files', 'handover-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for handover files
CREATE POLICY "Users can view handover files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'handover-files');

CREATE POLICY "Users can upload handover files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'handover-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update handover files" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'handover-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete handover files" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'handover-files' AND auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_handover_protocols_org ON public.handover_protocols(organization_id);
CREATE INDEX idx_handover_protocols_unit ON public.handover_protocols(unit_id);
CREATE INDEX idx_handover_protocols_status ON public.handover_protocols(status);
CREATE INDEX idx_handover_rooms_protocol ON public.handover_rooms(protocol_id);
CREATE INDEX idx_handover_defects_protocol ON public.handover_defects(protocol_id);
CREATE INDEX idx_handover_signatures_protocol ON public.handover_signatures(protocol_id);
CREATE INDEX idx_handover_keys_protocol ON public.handover_keys(protocol_id);