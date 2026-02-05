-- Create enum types for listings
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'rented');
CREATE TYPE portal_type AS ENUM ('immoscout', 'immowelt', 'ebay', 'website');
CREATE TYPE portal_status AS ENUM ('pending', 'published', 'error', 'removed');
CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'viewing', 'cancelled', 'rented');

-- Create listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  rent_cold INTEGER NOT NULL DEFAULT 0, -- in cents
  rent_additional INTEGER DEFAULT 0, -- Nebenkosten in cents
  heating_included BOOLEAN DEFAULT true,
  heating_costs INTEGER DEFAULT 0, -- separate heating costs in cents
  deposit INTEGER DEFAULT 0, -- in cents
  commission TEXT, -- Provision description
  features JSONB DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  main_photo_index INTEGER DEFAULT 0,
  available_from DATE,
  energy_certificate_type VARCHAR(50),
  energy_value NUMERIC(5,1),
  energy_class VARCHAR(10),
  status listing_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create listing_portals table for tracking publication status per portal
CREATE TABLE public.listing_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  portal portal_type NOT NULL,
  external_id VARCHAR(255),
  status portal_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, portal)
);

-- Create listing_inquiries table
CREATE TABLE public.listing_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  portal_source portal_type,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  message TEXT,
  status inquiry_status NOT NULL DEFAULT 'new',
  contacted_at TIMESTAMP WITH TIME ZONE,
  viewing_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portal_connections table for storing API credentials
CREATE TABLE public.portal_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  portal portal_type NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  api_credentials JSONB DEFAULT '{}', -- encrypted credentials
  last_sync_at TIMESTAMP WITH TIME ZONE,
  active_listings_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'disconnected',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, portal)
);

-- Create listing_settings table for organization-wide settings
CREATE TABLE public.listing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_description TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  viewing_time_slots JSONB DEFAULT '[]',
  auto_deactivate_on_rental BOOLEAN DEFAULT true,
  notify_on_inquiry BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for listings
CREATE POLICY "Users can view listings from their organization"
ON public.listings FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create listings for their organization"
ON public.listings FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update listings from their organization"
ON public.listings FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete listings from their organization"
ON public.listings FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS policies for listing_portals
CREATE POLICY "Users can view portal data for their listings"
ON public.listing_portals FOR SELECT
USING (listing_id IN (
  SELECT id FROM public.listings WHERE organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage portal data for their listings"
ON public.listing_portals FOR ALL
USING (listing_id IN (
  SELECT id FROM public.listings WHERE organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- RLS policies for listing_inquiries
CREATE POLICY "Users can view inquiries from their organization"
ON public.listing_inquiries FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage inquiries from their organization"
ON public.listing_inquiries FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS policies for portal_connections
CREATE POLICY "Users can view portal connections from their organization"
ON public.portal_connections FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage portal connections from their organization"
ON public.portal_connections FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS policies for listing_settings
CREATE POLICY "Users can view settings from their organization"
ON public.listing_settings FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage settings for their organization"
ON public.listing_settings FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_listings_organization ON public.listings(organization_id);
CREATE INDEX idx_listings_unit ON public.listings(unit_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listing_portals_listing ON public.listing_portals(listing_id);
CREATE INDEX idx_listing_inquiries_listing ON public.listing_inquiries(listing_id);
CREATE INDEX idx_listing_inquiries_organization ON public.listing_inquiries(organization_id);
CREATE INDEX idx_listing_inquiries_status ON public.listing_inquiries(status);

-- Create trigger for updating timestamps
CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listing_portals_updated_at
BEFORE UPDATE ON public.listing_portals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listing_inquiries_updated_at
BEFORE UPDATE ON public.listing_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_connections_updated_at
BEFORE UPDATE ON public.portal_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listing_settings_updated_at
BEFORE UPDATE ON public.listing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();